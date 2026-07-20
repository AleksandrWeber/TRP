import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ExchangeAdapterService } from '../exchange-adapter';
import { OrderService } from '../order-engine';
import { PositionService } from '../position-engine';
import { createSynchronizationLog, type SynchronizationLog } from './domain/synchronization-log';
import type { LiveSession } from './domain/live-session';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveSessionManager } from './live-session-manager';
import { LiveSynchronizationFailedError } from './live-trading-errors';
import { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';

export type SyncInconsistency = Readonly<{
  kind: 'BALANCE' | 'POSITION' | 'ORDER' | 'EXECUTION';
  message: string;
  exchangeValue?: string;
  coreValue?: string;
}>;

export type SynchronizationResult = Readonly<{
  session: LiveSession;
  log: SynchronizationLog;
  inconsistencies: readonly SyncInconsistency[];
  balances: number;
  positions: number;
  openOrders: number;
}>;

/**
 * SynchronizationManager — periodically reconciles exchange state vs Trading Core (US210).
 * Detects inconsistencies; does not mutate Portfolio/Position directly.
 */
@Injectable()
export class SynchronizationManager {
  private lastCompletedAt = new Map<string, string>();

  constructor(
    @Inject(LIVE_TRADING_REPOSITORY) private readonly repository: LiveTradingRepository,
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
    @Inject(ExchangeAdapterService) private readonly exchanges: ExchangeAdapterService,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(PositionService) private readonly positions: PositionService,
  ) {}

  getLastCompletedAt(sessionId: string): string | null {
    return this.lastCompletedAt.get(sessionId) ?? null;
  }

  async synchronize(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
  ): Promise<SynchronizationResult> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    const startedAt = new Date().toISOString();

    await this.sessions.setSynchronizationState(session, 'SYNCING');
    await this.events.publish({
      eventType: 'SynchronizationStarted',
      sessionId: session.id,
      occurredAt: startedAt,
      synchronizationState: 'SYNCING',
    });

    const log = await this.repository.createSynchronizationLog(
      createSynchronizationLog({
        id: randomUUID(),
        sessionId: session.id,
        kind: 'FULL_SYNC',
        status: 'STARTED',
        startedAt,
        details: { exchange: session.exchange },
      }),
    );

    try {
      const [balances, exchangePositions, corePositions, coreOrders] = await Promise.all([
        this.exchanges.getBalances(workspaceId, session.exchange),
        this.exchanges.getPositions(workspaceId, session.exchange),
        this.positions.list(session.portfolioWorkspaceKey, ownerId),
        this.orders.list(session.portfolioWorkspaceKey, ownerId),
      ]);

      const openCoreOrders = coreOrders.filter((o) =>
        ['CREATED', 'VALIDATED', 'PENDING', 'PARTIALLY_FILLED'].includes(o.status),
      );
      const openCorePositions = corePositions.filter(
        (p) => p.status === 'OPEN' || p.status === 'PARTIALLY_CLOSED',
      );

      const inconsistencies: SyncInconsistency[] = [];

      // Position count mismatch is an inconsistency signal (recovery reconciles).
      if (exchangePositions.length !== openCorePositions.length) {
        inconsistencies.push({
          kind: 'POSITION',
          message: 'open position count mismatch between exchange and trading core',
          exchangeValue: String(exchangePositions.length),
          coreValue: String(openCorePositions.length),
        });
      }

      for (const exchangePos of exchangePositions) {
        const match = openCorePositions.find((p) => p.symbol === exchangePos.symbol);
        if (!match) {
          inconsistencies.push({
            kind: 'POSITION',
            message: `exchange position missing in trading core: ${exchangePos.symbol}`,
            exchangeValue: exchangePos.quantity,
          });
          continue;
        }
        if (match.quantity !== exchangePos.quantity) {
          inconsistencies.push({
            kind: 'POSITION',
            message: `position quantity mismatch for ${exchangePos.symbol}`,
            exchangeValue: exchangePos.quantity,
            coreValue: match.quantity,
          });
        }
      }

      // Quote balance presence is informational; cash is owned by Portfolio engine.
      const quote = balances.find((b) => b.asset === 'USDT' || b.asset === 'USD');
      if (!quote) {
        inconsistencies.push({
          kind: 'BALANCE',
          message: 'quote balance not reported by exchange',
        });
      }

      const completedAt = new Date().toISOString();
      const nextState = inconsistencies.length > 0 ? 'OUT_OF_SYNC' : 'SYNCED';
      const updatedSession = await this.sessions.setSynchronizationState(session, nextState);
      this.lastCompletedAt.set(session.id, completedAt);

      const completedLog = await this.repository.saveSynchronizationLog(
        createSynchronizationLog({
          id: log.id,
          sessionId: log.sessionId,
          kind: log.kind,
          status: 'COMPLETED',
          startedAt: log.startedAt,
          completedAt,
          details: {
            exchange: session.exchange,
            inconsistencyCount: inconsistencies.length,
            balances: balances.length,
            positions: exchangePositions.length,
            openOrders: openCoreOrders.length,
            inconsistencies,
          },
        }),
      );

      await this.events.publish({
        eventType: 'SynchronizationCompleted',
        sessionId: session.id,
        occurredAt: completedAt,
        synchronizationState: nextState,
        inconsistencyCount: inconsistencies.length,
      });

      return Object.freeze({
        session: updatedSession,
        log: completedLog,
        inconsistencies: Object.freeze(inconsistencies),
        balances: balances.length,
        positions: exchangePositions.length,
        openOrders: openCoreOrders.length,
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
            reason: error instanceof Error ? error.message : 'Synchronization failed',
          },
        }),
      );
      await this.events.publish({
        eventType: 'SynchronizationFailed',
        sessionId: session.id,
        occurredAt: failedAt,
        reason: error instanceof Error ? error.message : 'Synchronization failed',
      });
      throw new LiveSynchronizationFailedError(
        error instanceof Error ? error.message : 'Synchronization failed',
        error,
      );
    }
  }
}
