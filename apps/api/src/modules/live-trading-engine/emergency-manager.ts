import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderService } from '../order-engine';
import { PositionService } from '../position-engine';
import {
  freezeTrading,
  pauseLiveSession,
  unfreezeTrading,
  type LiveSession,
} from './domain/live-session';
import { createSynchronizationLog } from './domain/synchronization-log';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveSessionManager } from './live-session-manager';
import { LiveSessionInvalidStateError } from './live-trading-errors';
import { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';

export type KillSwitchOptions = Readonly<{
  /** When true, close open positions via Position Engine (default: true). */
  closePositions?: boolean;
  reason?: string;
}>;

export type KillSwitchResult = Readonly<{
  session: LiveSession;
  cancelledOrders: number;
  closedPositions: number;
  strategyDisabled: boolean;
  tradingFrozen: boolean;
  reason: string;
}>;

/**
 * EmergencyManager — exchange-independent Kill Switch (US210).
 *
 * Sequence:
 * 1. Freeze Trading (blocks new orders immediately)
 * 2. Cancel All Orders (Trading Core Order Lifecycle)
 * 3. Disable Strategy (operational flag via freeze + event)
 * 4. Close Positions (configurable, via Position Engine)
 *
 * Does not depend on Exchange Adapter connectivity.
 */
@Injectable()
export class EmergencyManager {
  constructor(
    @Inject(LIVE_TRADING_REPOSITORY) private readonly repository: LiveTradingRepository,
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(PositionService) private readonly positions: PositionService,
  ) {}

  async activateKillSwitch(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
    options: KillSwitchOptions = {},
  ): Promise<KillSwitchResult> {
    const closePositions = options.closePositions !== false;
    const reason = (options.reason ?? 'kill switch activated').trim() || 'kill switch activated';
    let session = await this.sessions.requireSession(workspaceId, sessionId);
    const now = new Date().toISOString();

    // 1. Freeze trading first — independent of exchange
    session = freezeTrading(session, now);
    session = await this.sessions.save(session);
    await this.events.publish({
      eventType: 'TradingFrozen',
      sessionId: session.id,
      occurredAt: now,
      tradingFrozen: true,
    });

    // Pause if running so UI/status reflects halted operations
    if (session.status === 'RUNNING') {
      try {
        session = pauseLiveSession(session, now);
        session = freezeTrading(session, now);
        session = await this.sessions.save(session);
      } catch {
        // Keep freeze even if pause transition is invalid.
      }
    }

    // 2. Cancel all open orders via Order Lifecycle (no exchange required)
    let cancelledOrders = 0;
    const openOrders = await this.orders.listOpen(session.portfolioWorkspaceKey, ownerId);
    for (const order of openOrders) {
      try {
        await this.orders.cancel(session.portfolioWorkspaceKey, ownerId, order.id, reason);
        cancelledOrders += 1;
      } catch {
        // Best-effort cancel; continue with remaining orders.
      }
    }

    // 3. Disable strategy — freeze + event is the operational disable signal
    const strategyDisabled = true;

    // 4. Close positions (configurable) via Position Engine
    let closedPositions = 0;
    if (closePositions) {
      const openPositions = await this.positions.listOpen(session.portfolioWorkspaceKey, ownerId);
      for (const position of openPositions) {
        try {
          await this.positions.close(session.portfolioWorkspaceKey, ownerId, {
            positionId: position.id,
            price: position.markPrice || position.averageEntryPrice || position.entryPrice,
          });
          closedPositions += 1;
        } catch {
          // Best-effort close; continue.
        }
      }
    }

    await this.repository.createSynchronizationLog(
      createSynchronizationLog({
        id: randomUUID(),
        sessionId: session.id,
        kind: 'KILL_SWITCH',
        status: 'COMPLETED',
        startedAt: now,
        completedAt: new Date().toISOString(),
        details: {
          reason,
          cancelledOrders,
          closedPositions,
          strategyDisabled,
          tradingFrozen: true,
          closePositions,
        },
      }),
    );

    await this.events.publish({
      eventType: 'KillSwitchActivated',
      sessionId: session.id,
      occurredAt: new Date().toISOString(),
      cancelledOrders,
      closedPositions,
      strategyDisabled,
      tradingFrozen: true,
      closePositions,
    });

    session = await this.sessions.requireSession(workspaceId, sessionId);
    return Object.freeze({
      session,
      cancelledOrders,
      closedPositions,
      strategyDisabled,
      tradingFrozen: true,
      reason,
    });
  }

  async clearKillSwitch(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    if (!session.tradingFrozen) {
      throw new LiveSessionInvalidStateError('trading is not frozen');
    }
    const now = new Date().toISOString();
    const cleared = unfreezeTrading(session, now);
    const saved = await this.sessions.save(cleared);
    await this.events.publish({
      eventType: 'KillSwitchCleared',
      sessionId: saved.id,
      occurredAt: now,
      tradingFrozen: false,
    });
    return saved;
  }
}
