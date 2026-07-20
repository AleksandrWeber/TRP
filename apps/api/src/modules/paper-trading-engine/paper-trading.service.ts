import { Inject, Injectable } from '@nestjs/common';
import type { OrderView } from '../order-engine';
import { OrderService } from '../order-engine';
import type { PortfolioView } from '../portfolio-engine';
import { PortfolioService } from '../portfolio-engine';
import type { PositionView } from '../position-engine';
import { PositionService } from '../position-engine';
import type { PaperExecution } from './domain/paper-execution';
import type { PaperEventRecord } from './domain/paper-event';
import type { PaperSession } from './domain/paper-session';
import {
  PaperExecutionCoordinator,
  type PaperTradeRequest,
  type PaperTradeResult,
} from './paper-execution-coordinator';
import { PaperEventPublisher } from './paper-event-publisher';
import {
  PaperSessionManager,
  type CreateSessionRequest,
  type PaperTradingClock,
} from './paper-session-manager';
import {
  generatePaperSessionStatistics,
  type PaperSessionStatistics,
} from './paper-session-statistics';
import { PAPER_TRADING_REPOSITORY, type PaperTradingRepository } from './paper-trading.repository';

export type PaperSessionView = Readonly<{
  id: string;
  name: string;
  status: string;
  initialBalance: string;
  currentBalance: string;
  portfolioId: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}>;

/**
 * Paper Trading Engine application service (US208).
 * Orchestrates session lifecycle and simulated trading via existing engines.
 */
@Injectable()
export class PaperTradingService {
  constructor(
    @Inject(PaperSessionManager) private readonly sessions: PaperSessionManager,
    @Inject(PaperExecutionCoordinator) private readonly coordinator: PaperExecutionCoordinator,
    @Inject(PaperEventPublisher) private readonly events: PaperEventPublisher,
    @Inject(PAPER_TRADING_REPOSITORY) private readonly repository: PaperTradingRepository,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(PositionService) private readonly positions: PositionService,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  setClock(clock: PaperTradingClock): void {
    this.sessions.setClock(clock);
  }

  async listSessions(workspaceId: string): Promise<PaperSessionView[]> {
    const list = await this.sessions.list(workspaceId);
    return list.map((s) => this.toView(s));
  }

  async getSession(workspaceId: string, sessionId: string): Promise<PaperSessionView> {
    return this.toView(await this.sessions.getById(workspaceId, sessionId));
  }

  async createSession(
    workspaceId: string,
    ownerId: string,
    request: CreateSessionRequest,
  ): Promise<PaperSessionView> {
    return this.toView(await this.sessions.create(workspaceId, ownerId, request));
  }

  async startSession(workspaceId: string, sessionId: string): Promise<PaperSessionView> {
    return this.toView(await this.sessions.start(workspaceId, sessionId));
  }

  async pauseSession(workspaceId: string, sessionId: string): Promise<PaperSessionView> {
    return this.toView(await this.sessions.pause(workspaceId, sessionId));
  }

  async stopSession(workspaceId: string, sessionId: string): Promise<PaperSessionView> {
    return this.toView(await this.sessions.stop(workspaceId, sessionId));
  }

  async completeSession(workspaceId: string, sessionId: string): Promise<PaperSessionView> {
    return this.toView(await this.sessions.complete(workspaceId, sessionId));
  }

  async deleteSession(
    workspaceId: string,
    sessionId: string,
  ): Promise<{ id: string; deleted: boolean }> {
    return this.sessions.remove(workspaceId, sessionId);
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

  async listExecutions(workspaceId: string, sessionId: string): Promise<PaperExecution[]> {
    await this.sessions.requireSession(workspaceId, sessionId);
    return this.repository.listExecutionsBySessionId(sessionId);
  }

  async listEvents(workspaceId: string, sessionId: string): Promise<PaperEventRecord[]> {
    await this.sessions.requireSession(workspaceId, sessionId);
    return this.repository.listEventsBySessionId(sessionId);
  }

  async getStatistics(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
  ): Promise<PaperSessionStatistics> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    const [portfolio, positions, executions, snapshots] = await Promise.all([
      this.getPortfolio(workspaceId, ownerId, sessionId),
      this.listPositions(workspaceId, ownerId, sessionId),
      this.listExecutions(workspaceId, sessionId),
      this.portfolios.listSnapshots(session.portfolioWorkspaceKey),
    ]);
    const equityCurve = snapshots.map((s) => s.equity.equity);
    return generatePaperSessionStatistics({
      session,
      portfolio,
      positions,
      executions,
      equityCurve: equityCurve.length > 0 ? equityCurve : undefined,
    });
  }

  async executeTrade(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
    request: PaperTradeRequest,
  ): Promise<PaperTradeResult> {
    return this.coordinator.executeTrade(workspaceId, ownerId, sessionId, request);
  }

  getPublishedEvents() {
    return this.events.getPublishedEvents();
  }

  private toView(session: PaperSession): PaperSessionView {
    return Object.freeze({
      id: session.id,
      name: session.name,
      status: session.status,
      initialBalance: session.initialBalance,
      currentBalance: session.currentBalance,
      portfolioId: session.portfolioId,
      createdAt: session.createdAt,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
    });
  }
}
