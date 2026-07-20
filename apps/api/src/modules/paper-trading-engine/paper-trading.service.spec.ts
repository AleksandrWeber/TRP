import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Portfolio } from '../portfolio-engine/domain/portfolio';
import type { PortfolioSnapshot } from '../portfolio-engine/domain/portfolio-snapshot';
import { PortfolioEventPublisher } from '../portfolio-engine/portfolio-event-publisher';
import type { PortfolioDomainEvent } from '../portfolio-engine/portfolio-events';
import type { PortfolioRepository } from '../portfolio-engine/portfolio.repository';
import { PortfolioService } from '../portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../portfolio-engine/portfolio-snapshot.service';
import type { Position } from '../position-engine/domain/position';
import type { PositionHistory } from '../position-engine/domain/position-history';
import { PositionEventPublisher } from '../position-engine/position-event-publisher';
import type { PositionDomainEvent } from '../position-engine/position-events';
import { PositionHistoryService } from '../position-engine/position-history.service';
import type { PositionRepository } from '../position-engine/position.repository';
import { PositionService } from '../position-engine/position.service';
import type { Order } from '../order-engine/domain/order';
import type { OrderFill } from '../order-engine/domain/order-fill';
import type { OrderHistory } from '../order-engine/domain/order-history';
import { OrderEventPublisher } from '../order-engine/order-event-publisher';
import type { OrderDomainEvent } from '../order-engine/order-events';
import { OrderExecutionService } from '../order-engine/order-execution.service';
import { OrderFillService } from '../order-engine/order-fill.service';
import { OrderHistoryService } from '../order-engine/order-history.service';
import type { OrderRepository } from '../order-engine/order.repository';
import { OrderService } from '../order-engine/order.service';
import type { RiskDecision } from '../risk-engine/domain/risk-decision';
import type { RiskPolicy } from '../risk-engine/domain/risk-policy';
import { RiskEventPublisher } from '../risk-engine/risk-event-publisher';
import type { RiskDomainEvent } from '../risk-engine/risk-events';
import type { RiskRepository } from '../risk-engine/risk.repository';
import { RiskService } from '../risk-engine/risk.service';
import type { PaperExecution } from './domain/paper-execution';
import type { PaperEventRecord } from './domain/paper-event';
import type { PaperSession } from './domain/paper-session';
import { PaperEventPublisher } from './paper-event-publisher';
import { PaperExecutionCoordinator } from './paper-execution-coordinator';
import { PaperSessionManager } from './paper-session-manager';
import { generatePaperSessionStatistics } from './paper-session-statistics';
import type { PaperTradingDomainEvent } from './paper-trading-events';
import { PaperOrderRejectedError, PaperSessionInvalidStateError } from './paper-trading-errors';
import type { PaperTradingRepository } from './paper-trading.repository';
import { PaperTradingService } from './paper-trading.service';

const WS = 'ws-us208';
const OWNER = 'owner-1';
const T0 = '2026-07-20T16:00:00.000Z';

class InMemoryPortfolioRepository implements PortfolioRepository {
  portfolios = new Map<string, Portfolio>();
  snapshots: PortfolioSnapshot[] = [];
  events: Array<{ id: string; event: PortfolioDomainEvent }> = [];

  async create(portfolio: Portfolio): Promise<Portfolio> {
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }
  async save(portfolio: Portfolio): Promise<Portfolio> {
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }
  async findByWorkspaceId(workspaceId: string): Promise<Portfolio | null> {
    return [...this.portfolios.values()].find((p) => p.workspaceId === workspaceId) ?? null;
  }
  async findById(portfolioId: string): Promise<Portfolio | null> {
    return this.portfolios.get(portfolioId) ?? null;
  }
  async createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    this.snapshots.push(snapshot);
    return snapshot;
  }
  async listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    return this.snapshots.filter((s) => s.portfolioId === portfolioId);
  }
  async appendEvent(event: PortfolioDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(portfolioId: string): Promise<PortfolioDomainEvent[]> {
    return this.events.filter((e) => e.event.portfolioId === portfolioId).map((e) => e.event);
  }
}

class InMemoryPositionRepository implements PositionRepository {
  positions = new Map<string, Position>();
  history: PositionHistory[] = [];
  events: Array<{ id: string; event: PositionDomainEvent }> = [];

  async create(position: Position): Promise<Position> {
    this.positions.set(position.id, position);
    return position;
  }
  async save(position: Position): Promise<Position> {
    this.positions.set(position.id, position);
    return position;
  }
  async findById(id: string): Promise<Position | null> {
    return this.positions.get(id) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Position[]> {
    return [...this.positions.values()].filter((p) => p.portfolioId === portfolioId);
  }
  async listOpenByPortfolioId(portfolioId: string): Promise<Position[]> {
    return (await this.listByPortfolioId(portfolioId)).filter(
      (p) => p.status === 'OPEN' || p.status === 'PARTIALLY_CLOSED',
    );
  }
  async createHistory(entry: PositionHistory): Promise<PositionHistory> {
    this.history.push(entry);
    return entry;
  }
  async listHistoryByPositionId(positionId: string): Promise<PositionHistory[]> {
    return this.history.filter((h) => h.positionId === positionId);
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<PositionHistory[]> {
    const ids = new Set(
      [...this.positions.values()].filter((p) => p.portfolioId === portfolioId).map((p) => p.id),
    );
    return this.history.filter((h) => ids.has(h.positionId));
  }
  async appendEvent(event: PositionDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(positionId: string): Promise<PositionDomainEvent[]> {
    return this.events.filter((e) => e.event.positionId === positionId).map((e) => e.event);
  }
}

class InMemoryOrderRepository implements OrderRepository {
  orders = new Map<string, Order>();
  fills: OrderFill[] = [];
  history: OrderHistory[] = [];
  events: Array<{ id: string; event: OrderDomainEvent }> = [];

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
  async findById(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Order[]> {
    return [...this.orders.values()].filter((o) => o.portfolioId === portfolioId);
  }
  async listOpenByPortfolioId(portfolioId: string): Promise<Order[]> {
    return (await this.listByPortfolioId(portfolioId)).filter((o) =>
      ['CREATED', 'VALIDATED', 'PENDING', 'PARTIALLY_FILLED'].includes(o.status),
    );
  }
  async createFill(fill: OrderFill): Promise<OrderFill> {
    this.fills.push(fill);
    return fill;
  }
  async listFillsByOrderId(orderId: string): Promise<OrderFill[]> {
    return this.fills.filter((f) => f.orderId === orderId);
  }
  async createHistory(entry: OrderHistory): Promise<OrderHistory> {
    this.history.push(entry);
    return entry;
  }
  async listHistoryByOrderId(orderId: string): Promise<OrderHistory[]> {
    return this.history.filter((h) => h.orderId === orderId);
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<OrderHistory[]> {
    const ids = new Set(
      [...this.orders.values()].filter((o) => o.portfolioId === portfolioId).map((o) => o.id),
    );
    return this.history.filter((h) => ids.has(h.orderId));
  }
  async appendEvent(event: OrderDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(orderId: string): Promise<OrderDomainEvent[]> {
    return this.events.filter((e) => e.event.orderId === orderId).map((e) => e.event);
  }
}

class InMemoryRiskRepository implements RiskRepository {
  decisions = new Map<string, RiskDecision>();
  policies = new Map<string, RiskPolicy>();
  events: Array<{ id: string; event: RiskDomainEvent }> = [];

  async createDecision(decision: RiskDecision): Promise<RiskDecision> {
    this.decisions.set(decision.id, decision);
    return decision;
  }
  async findDecisionById(decisionId: string): Promise<RiskDecision | null> {
    return this.decisions.get(decisionId) ?? null;
  }
  async listDecisionsByPortfolioId(portfolioId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()].filter((d) => d.portfolioId === portfolioId);
  }
  async listDecisionsByOrderId(orderId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()].filter((d) => d.orderId === orderId);
  }
  async createPolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    this.policies.set(policy.id, policy);
    return policy;
  }
  async savePolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    this.policies.set(policy.id, policy);
    return policy;
  }
  async findPolicyById(policyId: string): Promise<RiskPolicy | null> {
    return this.policies.get(policyId) ?? null;
  }
  async listPolicies(portfolioId: string | null): Promise<RiskPolicy[]> {
    return [...this.policies.values()].filter((p) =>
      portfolioId === null
        ? p.portfolioId === null
        : p.portfolioId === portfolioId || p.portfolioId === null,
    );
  }
  async appendEvent(event: RiskDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsByDecisionId(decisionId: string): Promise<RiskDomainEvent[]> {
    return this.events.filter((e) => e.event.decisionId === decisionId).map((e) => e.event);
  }
}

class InMemoryPaperTradingRepository implements PaperTradingRepository {
  sessions = new Map<string, PaperSession>();
  executions: PaperExecution[] = [];
  events: Array<{ id: string; event: PaperTradingDomainEvent }> = [];

  async createSession(session: PaperSession): Promise<PaperSession> {
    this.sessions.set(session.id, session);
    return session;
  }
  async saveSession(session: PaperSession): Promise<PaperSession> {
    this.sessions.set(session.id, session);
    return session;
  }
  async findSessionById(sessionId: string): Promise<PaperSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }
  async listSessionsByWorkspaceId(workspaceId: string): Promise<PaperSession[]> {
    return [...this.sessions.values()]
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
  async createExecution(execution: PaperExecution): Promise<PaperExecution> {
    this.executions.push(execution);
    return execution;
  }
  async listExecutionsBySessionId(sessionId: string): Promise<PaperExecution[]> {
    return this.executions.filter((e) => e.sessionId === sessionId);
  }
  async appendEvent(event: PaperTradingDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsBySessionId(sessionId: string): Promise<PaperEventRecord[]> {
    return this.events
      .filter((e) => e.event.sessionId === sessionId)
      .map((e) =>
        Object.freeze({
          id: e.id,
          sessionId: e.event.sessionId,
          type: e.event.eventType,
          timestamp: e.event.occurredAt,
          payload: Object.freeze({ ...e.event }),
        }),
      );
  }
}

function buildHarness() {
  const portfolioRepo = new InMemoryPortfolioRepository();
  const portfolioEvents = new PortfolioEventPublisher(portfolioRepo);
  const snapshots = new PortfolioSnapshotService(portfolioRepo, portfolioEvents);
  const portfolioService = new PortfolioService(portfolioRepo, snapshots, portfolioEvents, {
    get: () => 'development',
  } as unknown as ConfigService);
  portfolioService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const positionRepo = new InMemoryPositionRepository();
  const positionEvents = new PositionEventPublisher(positionRepo);
  const positionHistory = new PositionHistoryService(positionRepo);
  const positionService = new PositionService(
    positionRepo,
    positionHistory,
    positionEvents,
    portfolioService,
  );
  positionService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const riskRepo = new InMemoryRiskRepository();
  const riskEvents = new RiskEventPublisher(riskRepo);
  const riskService = new RiskService(riskRepo, riskEvents, portfolioService, positionService);
  riskService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const orderRepo = new InMemoryOrderRepository();
  const orderEvents = new OrderEventPublisher(orderRepo);
  const orderHistory = new OrderHistoryService(orderRepo, orderEvents);
  const fillService = new OrderFillService(orderRepo);
  const execution = new OrderExecutionService(
    orderRepo,
    fillService,
    orderHistory,
    orderEvents,
    positionService,
    portfolioService,
  );
  const orderService = new OrderService(
    orderRepo,
    orderHistory,
    orderEvents,
    fillService,
    execution,
    portfolioService,
    riskService,
  );
  orderService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const paperRepo = new InMemoryPaperTradingRepository();
  const paperEvents = new PaperEventPublisher(paperRepo);
  const sessionManager = new PaperSessionManager(paperRepo, paperEvents, portfolioService);
  sessionManager.setClock({ now: () => new Date(T0), iso: () => T0 });
  const coordinator = new PaperExecutionCoordinator(
    paperRepo,
    sessionManager,
    paperEvents,
    orderService,
    portfolioService,
  );
  const service = new PaperTradingService(
    sessionManager,
    coordinator,
    paperEvents,
    paperRepo,
    orderService,
    positionService,
    portfolioService,
  );

  return {
    service,
    paperEvents,
    paperRepo,
    portfolioService,
    orderService,
    positionService,
    riskService,
  };
}

describe('US208 PaperTradingService', () => {
  let service: PaperTradingService;
  let paperEvents: PaperEventPublisher;
  let portfolioService: PortfolioService;
  let riskService: RiskService;

  beforeEach(() => {
    ({ service, paperEvents, portfolioService, riskService } = buildHarness());
    paperEvents.clearPublishedEvents();
  });

  it('creates a session with owned portfolio and publishes PaperSessionCreated', async () => {
    const session = await service.createSession(WS, OWNER, {
      name: 'Alpha',
      initialBalance: '50000',
    });
    expect(session.status).toBe('CREATED');
    expect(session.initialBalance).toBe('50000');
    expect(session.currentBalance).toBe('50000');
    expect(session.portfolioId).toBeTruthy();

    const portfolio = await service.getPortfolio(WS, OWNER, session.id);
    expect(portfolio.balance.cash).toBe('50000');
    expect(paperEvents.getPublishedEvents().map((e) => e.eventType)).toEqual([
      'PaperSessionCreated',
    ]);
  });

  it('supports concurrent sessions with isolated portfolios', async () => {
    const a = await service.createSession(WS, OWNER, { name: 'A', initialBalance: '10000' });
    const b = await service.createSession(WS, OWNER, { name: 'B', initialBalance: '20000' });
    expect(a.portfolioId).not.toBe(b.portfolioId);
    const list = await service.listSessions(WS);
    expect(list).toHaveLength(2);
  });

  it('runs session lifecycle CREATED → RUNNING → PAUSED → RUNNING → STOPPED → COMPLETED', async () => {
    const created = await service.createSession(WS, OWNER, { name: 'Lifecycle' });
    const started = await service.startSession(WS, created.id);
    expect(started.status).toBe('RUNNING');
    const paused = await service.pauseSession(WS, created.id);
    expect(paused.status).toBe('PAUSED');
    const resumed = await service.startSession(WS, created.id);
    expect(resumed.status).toBe('RUNNING');
    const stopped = await service.stopSession(WS, created.id);
    expect(stopped.status).toBe('STOPPED');
    const completed = await service.completeSession(WS, created.id);
    expect(completed.status).toBe('COMPLETED');

    const types = paperEvents.getPublishedEvents().map((e) => e.eventType);
    expect(types).toEqual([
      'PaperSessionCreated',
      'PaperSessionStarted',
      'PaperSessionPaused',
      'PaperSessionStarted',
      'PaperSessionStopped',
      'PaperSessionCompleted',
    ]);
  });

  it('executes a trade through Order → Risk → Position → Portfolio and records execution', async () => {
    const session = await service.createSession(WS, OWNER, {
      name: 'Trade',
      initialBalance: '100000',
    });
    await service.startSession(WS, session.id);

    const result = await service.executeTrade(WS, OWNER, session.id, {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '1',
      requestedPrice: '100',
    });

    expect(result.order.status).toBe('FILLED');
    expect(result.execution).not.toBeNull();
    expect(result.execution!.executionPrice).toBe('100');

    const positions = await service.listPositions(WS, OWNER, session.id);
    expect(positions).toHaveLength(1);
    expect(positions[0]!.side).toBe('LONG');

    const orders = await service.listOrders(WS, OWNER, session.id);
    expect(orders).toHaveLength(1);

    const riskDecisions = await riskService.listDecisions(`paper-session:${session.id}`, OWNER);
    expect(riskDecisions.length).toBeGreaterThanOrEqual(1);
    expect(riskDecisions[0]!.decision).toBe('APPROVED');

    expect(paperEvents.getPublishedEvents().map((e) => e.eventType)).toContain(
      'PaperTradeExecuted',
    );

    const stats = await service.getStatistics(WS, OWNER, session.id);
    expect(stats.currentEquity).toBeTruthy();
    expect(stats.tradeCount).toBe(0); // position still open
  });

  it('rejects trades when session is not RUNNING', async () => {
    const session = await service.createSession(WS, OWNER, { name: 'Idle' });
    await expect(
      service.executeTrade(WS, OWNER, session.id, {
        symbol: 'BTC-USD',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '1',
        requestedPrice: '100',
      }),
    ).rejects.toBeInstanceOf(PaperSessionInvalidStateError);
  });

  it('does not bypass risk — rejected orders throw PaperOrderRejectedError', async () => {
    const session = await service.createSession(WS, OWNER, {
      name: 'RiskGate',
      initialBalance: '100000',
    });
    await service.startSession(WS, session.id);
    await portfolioService.applyFinancials(`paper-session:${session.id}`, {
      cash: '10',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
    });

    await expect(
      service.executeTrade(WS, OWNER, session.id, {
        symbol: 'BTC-USD',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '1',
        requestedPrice: '100',
      }),
    ).rejects.toBeInstanceOf(PaperOrderRejectedError);
  });

  it('archives via DELETE and hard-deletes when already archived', async () => {
    const session = await service.createSession(WS, OWNER, { name: 'DeleteMe' });
    const first = await service.deleteSession(WS, session.id);
    expect(first.deleted).toBe(false);
    const archived = await service.getSession(WS, session.id);
    expect(archived.status).toBe('ARCHIVED');
    const second = await service.deleteSession(WS, session.id);
    expect(second.deleted).toBe(true);
  });
});

describe('US208 paper session statistics', () => {
  it('computes win rate and profit factor from closed positions', () => {
    const stats = generatePaperSessionStatistics({
      session: {
        id: 's1',
        workspaceId: WS,
        ownerId: OWNER,
        portfolioId: 'p1',
        portfolioWorkspaceKey: 'paper-session:s1',
        name: 'Stats',
        status: 'RUNNING',
        initialBalance: '100000',
        currentBalance: '101000',
        createdAt: T0,
        startedAt: T0,
        finishedAt: null,
        updatedAt: T0,
      },
      portfolio: {
        id: 'p1',
        ownerId: OWNER,
        currency: 'USD',
        status: 'ACTIVE',
        balance: { cash: '100000' },
        equity: { equity: '101000', realizedPnL: '1000', unrealizedPnL: '0' },
        margin: { usedMargin: '0', availableMargin: '101000' },
        portfolioValue: '101000',
        portfolioReturn: '0.01',
        createdAt: T0,
        updatedAt: T0,
        refreshedAt: T0,
      },
      positions: [
        {
          id: 'pos-1',
          portfolioId: 'p1',
          symbol: 'BTC-USD',
          side: 'LONG',
          status: 'CLOSED',
          quantity: '0',
          entryPrice: '100',
          markPrice: '110',
          averageEntryPrice: '100',
          realizedPnL: '500',
          unrealizedPnL: '0',
          exposure: '0',
          positionValue: '0',
          returnPercent: '0',
          createdAt: T0,
          updatedAt: T0,
          closedAt: T0,
        },
        {
          id: 'pos-2',
          portfolioId: 'p1',
          symbol: 'ETH-USD',
          side: 'LONG',
          status: 'CLOSED',
          quantity: '0',
          entryPrice: '50',
          markPrice: '40',
          averageEntryPrice: '50',
          realizedPnL: '-200',
          unrealizedPnL: '0',
          exposure: '0',
          positionValue: '0',
          returnPercent: '0',
          createdAt: T0,
          updatedAt: T0,
          closedAt: T0,
        },
      ],
      executions: [],
      equityCurve: ['100000', '100500', '101000'],
    });

    expect(stats.winningTrades).toBe(1);
    expect(stats.losingTrades).toBe(1);
    expect(stats.winRate).toBe('0.5');
    expect(stats.profitFactor).toBe('2.5');
    expect(stats.netPnL).toBe('1000');
  });
});
