import { Inject, Injectable } from '@nestjs/common';
import type { OrderView } from '../order-engine';
import { OrderService } from '../order-engine';
import type { PortfolioView } from '../portfolio-engine';
import { PortfolioService } from '../portfolio-engine';
import type { PositionView } from '../position-engine';
import { PositionService } from '../position-engine';
import { isActiveLiveSessionStatus } from './domain/session-status';
import type { LiveEventRecord } from './domain/live-event';
import type { LiveSession } from './domain/live-session';
import type { SynchronizationLog } from './domain/synchronization-log';
import { ConnectionSupervisor } from './connection-supervisor';
import { HealthMonitor, type LiveWorkspaceHealth } from './health-monitor';
import {
  LiveExecutionCoordinator,
  type LiveOrderRequest,
  type LiveOrderResult,
} from './live-execution-coordinator';
import { LiveEventPublisher } from './live-event-publisher';
import {
  LiveSessionManager,
  type LiveTradingClock,
  type StartLiveSessionRequest,
} from './live-session-manager';
import { RecoveryManager, type RecoveryResult } from './recovery-manager';
import {
  EmergencyManager,
  type KillSwitchOptions,
  type KillSwitchResult,
} from './emergency-manager';
import { SynchronizationManager, type SynchronizationResult } from './synchronization-manager';
import { LiveSessionValidationError } from './live-trading-errors';
import { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';

export type LiveSessionView = Readonly<{
  id: string;
  exchange: string;
  accountId: string;
  status: string;
  startedAt: string | null;
  stoppedAt: string | null;
  lastHeartbeat: string | null;
  reconnectCount: number;
  synchronizationState: string;
  tradingFrozen: boolean;
  portfolioId: string;
  createdAt: string;
  updatedAt: string;
}>;

export type LiveStatusView = Readonly<{
  activeSessions: readonly LiveSessionView[];
  totalSessions: number;
  runningCount: number;
}>;

export type LiveSynchronizationView = Readonly<{
  logs: readonly SynchronizationLog[];
  sessions: readonly LiveSessionView[];
}>;

/**
 * Live Trading Workspace application service (US210).
 * Orchestrates session lifecycle, exchange connections, sync, recovery, and health.
 */
@Injectable()
export class LiveTradingService {
  constructor(
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(ConnectionSupervisor) private readonly connections: ConnectionSupervisor,
    @Inject(SynchronizationManager) private readonly sync: SynchronizationManager,
    @Inject(RecoveryManager) private readonly recovery: RecoveryManager,
    @Inject(EmergencyManager) private readonly emergency: EmergencyManager,
    @Inject(HealthMonitor) private readonly health: HealthMonitor,
    @Inject(LiveExecutionCoordinator) private readonly coordinator: LiveExecutionCoordinator,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
    @Inject(LIVE_TRADING_REPOSITORY) private readonly repository: LiveTradingRepository,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(PositionService) private readonly positions: PositionService,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  setClock(clock: LiveTradingClock): void {
    this.sessions.setClock(clock);
  }

  async listSessions(workspaceId: string): Promise<LiveSessionView[]> {
    const list = await this.sessions.list(workspaceId);
    return list.map((s) => this.toView(s));
  }

  async getStatus(workspaceId: string): Promise<LiveStatusView> {
    const list = await this.sessions.list(workspaceId);
    const active = list.filter((s) => isActiveLiveSessionStatus(s.status));
    return Object.freeze({
      activeSessions: Object.freeze(active.map((s) => this.toView(s))),
      totalSessions: list.length,
      runningCount: list.filter((s) => s.status === 'RUNNING').length,
    });
  }

  async getHealth(workspaceId: string): Promise<LiveWorkspaceHealth> {
    return this.health.evaluateWorkspace(workspaceId);
  }

  async getSynchronization(workspaceId: string): Promise<LiveSynchronizationView> {
    const [logs, sessions] = await Promise.all([
      this.repository.listSynchronizationLogsByWorkspaceId(workspaceId),
      this.sessions.list(workspaceId),
    ]);
    return Object.freeze({
      logs: Object.freeze(logs),
      sessions: Object.freeze(sessions.map((s) => this.toView(s))),
    });
  }

  /**
   * Start live trading: create session if needed, connect exchange, start RUNNING, initial sync.
   */
  async start(
    workspaceId: string,
    ownerId: string,
    request: StartLiveSessionRequest,
  ): Promise<LiveSessionView> {
    let session: LiveSession;
    if (request.sessionId) {
      session = await this.sessions.requireSession(workspaceId, request.sessionId);
    } else {
      const exchange = (request.exchange ?? '').trim();
      const accountId = (request.accountId ?? '').trim();
      if (exchange === '' || accountId === '') {
        throw new LiveSessionValidationError('exchange and accountId are required to start');
      }
      const existing = await this.repository.findActiveSessionByAccountId(workspaceId, accountId);
      session = existing ?? (await this.sessions.create(workspaceId, ownerId, exchange, accountId));
    }

    if (
      session.status === 'CREATED' ||
      session.status === 'STOPPED' ||
      session.status === 'FAILED'
    ) {
      session = await this.connections.connect(workspaceId, session);
    }
    if (session.status === 'CONNECTED' || session.status === 'PAUSED') {
      session = await this.sessions.start(workspaceId, session.id);
    } else if (session.status === 'RUNNING') {
      // already running
    } else {
      session = await this.sessions.start(workspaceId, session.id);
    }

    try {
      await this.sync.synchronize(workspaceId, ownerId, session.id);
      session = await this.sessions.requireSession(workspaceId, session.id);
    } catch {
      // Initial sync failure leaves session RUNNING but may be OUT_OF_SYNC.
      session = await this.sessions.requireSession(workspaceId, session.id);
    }

    return this.toView(session);
  }

  async stop(workspaceId: string, sessionId: string): Promise<LiveSessionView> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    await this.connections.disconnect(workspaceId, session);
    return this.toView(await this.sessions.stop(workspaceId, sessionId));
  }

  async pause(workspaceId: string, sessionId: string): Promise<LiveSessionView> {
    return this.toView(await this.sessions.pause(workspaceId, sessionId));
  }

  async resume(workspaceId: string, sessionId: string): Promise<LiveSessionView> {
    return this.toView(await this.sessions.resume(workspaceId, sessionId));
  }

  async reconnect(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
  ): Promise<RecoveryResult> {
    return this.recovery.recover(workspaceId, ownerId, sessionId);
  }

  async synchronize(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
  ): Promise<SynchronizationResult> {
    return this.sync.synchronize(workspaceId, ownerId, sessionId);
  }

  async activateKillSwitch(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
    options?: KillSwitchOptions,
  ): Promise<KillSwitchResult> {
    return this.emergency.activateKillSwitch(workspaceId, ownerId, sessionId, options);
  }

  async clearKillSwitch(workspaceId: string, sessionId: string): Promise<LiveSessionView> {
    return this.toView(await this.emergency.clearKillSwitch(workspaceId, sessionId));
  }

  async submitOrder(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
    request: LiveOrderRequest,
  ): Promise<LiveOrderResult> {
    return this.coordinator.submitOrder(workspaceId, ownerId, sessionId, request);
  }

  async listOrders(workspaceId: string, ownerId: string, sessionId: string): Promise<OrderView[]> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    return this.orders.list(session.portfolioWorkspaceKey, ownerId);
  }

  async listPositions(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
  ): Promise<PositionView[]> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    return this.positions.list(session.portfolioWorkspaceKey, ownerId);
  }

  async getPortfolio(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
  ): Promise<PortfolioView> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    await this.portfolios.getOrCreate(session.portfolioWorkspaceKey, ownerId);
    return this.portfolios.getPortfolio(session.portfolioWorkspaceKey);
  }

  async listEvents(workspaceId: string, sessionId: string): Promise<LiveEventRecord[]> {
    await this.sessions.requireSession(workspaceId, sessionId);
    return this.repository.listEventsBySessionId(sessionId);
  }

  getPublishedEvents() {
    return this.events.getPublishedEvents();
  }

  private toView(session: LiveSession): LiveSessionView {
    return Object.freeze({
      id: session.id,
      exchange: session.exchange,
      accountId: session.accountId,
      status: session.status,
      startedAt: session.startedAt,
      stoppedAt: session.stoppedAt,
      lastHeartbeat: session.lastHeartbeat,
      reconnectCount: session.reconnectCount,
      synchronizationState: session.synchronizationState,
      tradingFrozen: session.tradingFrozen,
      portfolioId: session.portfolioId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  }
}
