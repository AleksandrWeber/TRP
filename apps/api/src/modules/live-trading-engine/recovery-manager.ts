import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ExchangeAdapterService } from '../exchange-adapter';
import type { ExchangeExecution } from '../exchange-adapter';
import { OrderService } from '../order-engine';
import { createSynchronizationLog, type SynchronizationLog } from './domain/synchronization-log';
import type { LiveSession } from './domain/live-session';
import { ConnectionSupervisor } from './connection-supervisor';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveSessionManager } from './live-session-manager';
import { SynchronizationManager } from './synchronization-manager';
import { LiveRecoveryFailedError, LiveSessionInvalidStateError } from './live-trading-errors';
import { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';

export type RecoveryResult = Readonly<{
  session: LiveSession;
  log: SynchronizationLog;
  replayedExecutions: number;
  skippedDuplicates: number;
}>;

/**
 * RecoveryManager — reconnect, replay missed executions, refresh balances/positions,
 * rebuild order awareness. Never applies duplicate executions (US210).
 */
@Injectable()
export class RecoveryManager {
  constructor(
    @Inject(LIVE_TRADING_REPOSITORY) private readonly repository: LiveTradingRepository,
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
    @Inject(ConnectionSupervisor) private readonly connections: ConnectionSupervisor,
    @Inject(SynchronizationManager) private readonly sync: SynchronizationManager,
    @Inject(ExchangeAdapterService) private readonly exchanges: ExchangeAdapterService,
    @Inject(OrderService) private readonly orders: OrderService,
  ) {}

  async recover(workspaceId: string, ownerId: string, sessionId: string): Promise<RecoveryResult> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    const startedAt = new Date().toISOString();

    await this.sessions.setSynchronizationState(session, 'RECOVERING');
    await this.events.publish({
      eventType: 'RecoveryStarted',
      sessionId: session.id,
      occurredAt: startedAt,
      reconnectCount: session.reconnectCount,
    });

    const log = await this.repository.createSynchronizationLog(
      createSynchronizationLog({
        id: randomUUID(),
        sessionId: session.id,
        kind: 'RECOVERY',
        status: 'STARTED',
        startedAt,
        details: { reconnectCount: session.reconnectCount },
      }),
    );

    try {
      // 1. Reconnect exchange
      let current = await this.connections.reconnect(workspaceId, session.id);

      // 2. Refresh balances / positions / open orders via synchronization
      await this.sync.synchronize(workspaceId, ownerId, current.id);
      current = await this.sessions.requireSession(workspaceId, current.id);

      // 3. Replay missed executions without duplicates
      const { replayed, skipped } = await this.replayMissedExecutions(
        workspaceId,
        ownerId,
        current,
      );

      // 4. Rebuild order awareness from Trading Core open orders (no direct mutation)
      const openOrders = await this.orders.list(current.portfolioWorkspaceKey, ownerId);
      const openCount = openOrders.filter((o) =>
        ['PENDING', 'PARTIALLY_FILLED', 'VALIDATED'].includes(o.status),
      ).length;

      // 5. Restore operational status
      current = await this.sessions.requireSession(workspaceId, current.id);
      if (current.status === 'CONNECTED') {
        current = await this.sessions.start(workspaceId, current.id);
      } else if (current.status === 'PAUSED') {
        // Keep paused after recovery.
      } else if (current.status !== 'RUNNING') {
        // After reconnect sessions land in CONNECTED; start when possible.
        try {
          current = await this.sessions.start(workspaceId, current.id);
        } catch {
          // Leave status as-is when start is not allowed.
        }
      }

      current = await this.sessions.setSynchronizationState(current, 'SYNCED');

      const completedAt = new Date().toISOString();
      const completedLog = await this.repository.saveSynchronizationLog(
        createSynchronizationLog({
          id: log.id,
          sessionId: log.sessionId,
          kind: log.kind,
          status: 'COMPLETED',
          startedAt: log.startedAt,
          completedAt,
          details: {
            replayedExecutions: replayed,
            skippedDuplicates: skipped,
            openOrders: openCount,
          },
        }),
      );

      await this.events.publish({
        eventType: 'RecoveryCompleted',
        sessionId: current.id,
        occurredAt: completedAt,
        status: current.status,
        replayedExecutions: replayed,
      });
      await this.events.publish({
        eventType: 'LiveSessionRecovered',
        sessionId: current.id,
        occurredAt: completedAt,
        status: current.status,
        reconnectCount: current.reconnectCount,
      });

      return Object.freeze({
        session: current,
        log: completedLog,
        replayedExecutions: replayed,
        skippedDuplicates: skipped,
      });
    } catch (error) {
      const failedAt = new Date().toISOString();
      await this.sessions.setSynchronizationState(session, 'OUT_OF_SYNC');
      await this.repository.saveSynchronizationLog(
        createSynchronizationLog({
          id: log.id,
          sessionId: log.sessionId,
          kind: log.kind,
          status: 'FAILED',
          startedAt: log.startedAt,
          completedAt: failedAt,
          details: {
            reason: error instanceof Error ? error.message : 'Recovery failed',
          },
        }),
      );
      if (error instanceof LiveSessionInvalidStateError) {
        throw error;
      }
      throw new LiveRecoveryFailedError(
        error instanceof Error ? error.message : 'Recovery failed',
        error,
      );
    }
  }

  /**
   * Applies exchange executions to Trading Core via OrderService.execute when not yet processed.
   * Deduplicates by exchange executionId. Maps clientOrderId `live-{orderId}` back to core orders.
   */
  async replayMissedExecutions(
    workspaceId: string,
    ownerId: string,
    session: LiveSession,
  ): Promise<{ replayed: number; skipped: number }> {
    const executions = await this.exchanges.synchronizeExecutions(workspaceId, session.exchange);
    let replayed = 0;
    let skipped = 0;

    for (const execution of executions) {
      const orderId = orderIdFromClientOrderId(execution.clientOrderId);
      if (!orderId) {
        skipped += 1;
        continue;
      }
      try {
        const applied = await this.applyExecution(
          workspaceId,
          ownerId,
          session,
          orderId,
          execution,
        );
        if (applied) replayed += 1;
        else skipped += 1;
      } catch {
        skipped += 1;
      }
    }

    return { replayed, skipped };
  }

  /**
   * Apply a single exchange execution through Order Lifecycle.
   * Returns false when the execution was already processed (no duplicate).
   */
  async applyExecution(
    workspaceId: string,
    ownerId: string,
    session: LiveSession,
    orderId: string,
    execution: ExchangeExecution,
  ): Promise<boolean> {
    if (await this.repository.hasProcessedExecution(session.id, execution.executionId)) {
      return false;
    }

    const order = await this.orders.getById(session.portfolioWorkspaceKey, ownerId, orderId);
    if (order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      await this.repository.markExecutionProcessed(session.id, execution.executionId);
      return false;
    }

    await this.orders.execute(session.portfolioWorkspaceKey, ownerId, orderId, {
      price: execution.price,
      quantity: execution.quantity,
      fee: execution.fee,
    });
    await this.repository.markExecutionProcessed(session.id, execution.executionId);

    await this.events.publish({
      eventType: 'LiveOrderFilled',
      sessionId: session.id,
      occurredAt: execution.timestamp,
      orderId,
      exchangeOrderId: execution.exchangeOrderId,
      executionId: execution.executionId,
      price: execution.price,
      quantity: execution.quantity,
    });
    void workspaceId;
    return true;
  }
}

function orderIdFromClientOrderId(clientOrderId: string): string | null {
  const prefix = 'live-';
  if (!clientOrderId.startsWith(prefix)) return null;
  const id = clientOrderId.slice(prefix.length).trim();
  return id === '' ? null : id;
}
