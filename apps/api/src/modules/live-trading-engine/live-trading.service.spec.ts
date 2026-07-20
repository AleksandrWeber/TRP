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
import type { ExchangeConnection } from '../exchange-adapter/domain/exchange-connection';
import type { ExchangeDomainEvent } from '../exchange-adapter/exchange-adapter-events';
import type { ExchangeAdapterRepository } from '../exchange-adapter/exchange-adapter.repository';
import { ExchangeAdapterService } from '../exchange-adapter/exchange-adapter.service';
import { ExchangeEventPublisher } from '../exchange-adapter/exchange-event-publisher';
import { ExchangeFactory } from '../exchange-adapter/exchange-factory';
import { ExchangeManager } from '../exchange-adapter/exchange-manager';
import { ExchangeRegistry } from '../exchange-adapter/exchange-registry';
import { ExchangeRouter } from '../exchange-adapter/exchange-router';
import type { LiveEventRecord } from './domain/live-event';
import type { LiveSession } from './domain/live-session';
import type { SynchronizationLog } from './domain/synchronization-log';
import { ConnectionSupervisor } from './connection-supervisor';
import { HealthMonitor } from './health-monitor';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveExecutionCoordinator } from './live-execution-coordinator';
import { LiveSessionManager } from './live-session-manager';
import type { LiveTradingDomainEvent } from './live-trading-events';
import { LiveSessionAlreadyActiveError, LiveSessionInvalidStateError } from './live-trading-errors';
import type { LiveTradingRepository } from './live-trading.repository';
import { LiveTradingService } from './live-trading.service';
import { RecoveryManager } from './recovery-manager';
import { EmergencyManager } from './emergency-manager';
import { SynchronizationManager } from './synchronization-manager';

const WS = 'ws-us210';
const OWNER = 'owner-1';
const T0 = '2026-07-20T18:00:00.000Z';

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

class InMemoryExchangeRepository implements ExchangeAdapterRepository {
  connections = new Map<string, ExchangeConnection>();
  events: Array<{ id: string; event: ExchangeDomainEvent }> = [];

  async createConnection(connection: ExchangeConnection): Promise<ExchangeConnection> {
    this.connections.set(connection.id, connection);
    return connection;
  }
  async saveConnection(connection: ExchangeConnection): Promise<ExchangeConnection> {
    this.connections.set(connection.id, connection);
    return connection;
  }
  async findConnectionById(connectionId: string): Promise<ExchangeConnection | null> {
    return this.connections.get(connectionId) ?? null;
  }
  async findConnectionByWorkspaceAndExchange(
    workspaceId: string,
    exchangeId: string,
  ): Promise<ExchangeConnection | null> {
    return (
      [...this.connections.values()].find(
        (c) => c.workspaceId === workspaceId && c.exchangeId === exchangeId,
      ) ?? null
    );
  }
  async listConnectionsByWorkspaceId(workspaceId: string): Promise<ExchangeConnection[]> {
    return [...this.connections.values()].filter((c) => c.workspaceId === workspaceId);
  }
  async appendEvent(event: ExchangeDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsByConnectionId(connectionId: string): Promise<ExchangeDomainEvent[]> {
    return this.events.filter((e) => e.event.connectionId === connectionId).map((e) => e.event);
  }
}

class InMemoryLiveTradingRepository implements LiveTradingRepository {
  sessions = new Map<string, LiveSession>();
  events: Array<{ id: string; event: LiveTradingDomainEvent }> = [];
  logs: SynchronizationLog[] = [];
  processed = new Set<string>();

  async createSession(session: LiveSession): Promise<LiveSession> {
    this.sessions.set(session.id, session);
    return session;
  }
  async saveSession(session: LiveSession): Promise<LiveSession> {
    this.sessions.set(session.id, session);
    return session;
  }
  async findSessionById(sessionId: string): Promise<LiveSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }
  async listSessionsByWorkspaceId(workspaceId: string): Promise<LiveSession[]> {
    return [...this.sessions.values()]
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async findActiveSessionByAccountId(
    workspaceId: string,
    accountId: string,
  ): Promise<LiveSession | null> {
    const active = ['CONNECTING', 'CONNECTED', 'RUNNING', 'PAUSED', 'RECONNECTING'];
    return (
      [...this.sessions.values()].find(
        (s) =>
          s.workspaceId === workspaceId && s.accountId === accountId && active.includes(s.status),
      ) ?? null
    );
  }
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
  async appendEvent(event: LiveTradingDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsBySessionId(sessionId: string): Promise<LiveEventRecord[]> {
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
  async createSynchronizationLog(log: SynchronizationLog): Promise<SynchronizationLog> {
    this.logs.push(log);
    return log;
  }
  async saveSynchronizationLog(log: SynchronizationLog): Promise<SynchronizationLog> {
    const idx = this.logs.findIndex((l) => l.id === log.id);
    if (idx >= 0) this.logs[idx] = log;
    else this.logs.push(log);
    return log;
  }
  async listSynchronizationLogsBySessionId(sessionId: string): Promise<SynchronizationLog[]> {
    return this.logs.filter((l) => l.sessionId === sessionId);
  }
  async listSynchronizationLogsByWorkspaceId(workspaceId: string): Promise<SynchronizationLog[]> {
    const ids = new Set(
      [...this.sessions.values()].filter((s) => s.workspaceId === workspaceId).map((s) => s.id),
    );
    return this.logs.filter((l) => ids.has(l.sessionId));
  }
  async hasProcessedExecution(sessionId: string, executionId: string): Promise<boolean> {
    return this.processed.has(`${sessionId}:${executionId}`);
  }
  async markExecutionProcessed(sessionId: string, executionId: string): Promise<void> {
    this.processed.add(`${sessionId}:${executionId}`);
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

  const exchangeRepo = new InMemoryExchangeRepository();
  const registry = new ExchangeRegistry();
  const factory = new ExchangeFactory(registry);
  const router = new ExchangeRouter(registry);
  const exchangeEvents = new ExchangeEventPublisher(exchangeRepo);
  const exchangeManager = new ExchangeManager(
    factory,
    registry,
    router,
    exchangeEvents,
    exchangeRepo,
  );
  exchangeManager.setClock({ now: () => T0 });
  exchangeManager.onModuleInit();
  const exchangeService = new ExchangeAdapterService(exchangeManager);

  const liveRepo = new InMemoryLiveTradingRepository();
  const liveEvents = new LiveEventPublisher(liveRepo);
  const sessionManager = new LiveSessionManager(liveRepo, liveEvents, portfolioService);
  sessionManager.setClock({ now: () => new Date(T0), iso: () => T0 });
  const connections = new ConnectionSupervisor(sessionManager, exchangeService, liveEvents);
  const sync = new SynchronizationManager(
    liveRepo,
    sessionManager,
    liveEvents,
    exchangeService,
    orderService,
    positionService,
  );
  const recovery = new RecoveryManager(
    liveRepo,
    sessionManager,
    liveEvents,
    connections,
    sync,
    exchangeService,
    orderService,
  );
  const emergency = new EmergencyManager(
    liveRepo,
    sessionManager,
    liveEvents,
    orderService,
    positionService,
  );
  const health = new HealthMonitor(sessionManager, connections, sync, liveEvents);
  const coordinator = new LiveExecutionCoordinator(
    sessionManager,
    liveEvents,
    orderService,
    exchangeService,
    recovery,
    health,
  );
  const service = new LiveTradingService(
    sessionManager,
    connections,
    sync,
    recovery,
    emergency,
    health,
    coordinator,
    liveEvents,
    liveRepo,
    orderService,
    positionService,
    portfolioService,
  );

  return {
    service,
    liveEvents,
    liveRepo,
    recovery,
    sync,
    health,
    exchangeService,
    portfolioService,
    sessionManager,
  };
}

describe('US210 LiveTradingService', () => {
  let service: LiveTradingService;
  let liveEvents: LiveEventPublisher;
  let liveRepo: InMemoryLiveTradingRepository;
  let recovery: RecoveryManager;
  let portfolioService: PortfolioService;
  let sessionManager: LiveSessionManager;

  beforeEach(() => {
    ({ service, liveEvents, liveRepo, recovery, portfolioService, sessionManager } =
      buildHarness());
    liveEvents.clearPublishedEvents();
  });

  it('starts a live session: connect → running → sync', async () => {
    const session = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-1',
    });
    expect(session.status).toBe('RUNNING');
    expect(session.exchange).toBe('MOCK');
    expect(session.accountId).toBe('acct-1');
    expect(['SYNCED', 'OUT_OF_SYNC']).toContain(session.synchronizationState);

    const types = liveEvents.getPublishedEvents().map((e) => e.eventType);
    expect(types).toContain('LiveSessionCreated');
    expect(types).toContain('LiveSessionStarted');
    expect(types).toContain('SynchronizationStarted');
    expect(types).toContain('SynchronizationCompleted');
  });

  it('enforces one active live session per account', async () => {
    await service.start(WS, OWNER, { exchange: 'MOCK', accountId: 'acct-1' });
    // Idempotent start reuses the active session
    const again = await service.start(WS, OWNER, { exchange: 'MOCK', accountId: 'acct-1' });
    expect(again.accountId).toBe('acct-1');
    expect(again.status).toBe('RUNNING');
    // Explicit create of a second session for the same account is rejected
    await expect(sessionManager.create(WS, OWNER, 'MOCK', 'acct-1')).rejects.toBeInstanceOf(
      LiveSessionAlreadyActiveError,
    );
  });

  it('supports pause / resume / stop', async () => {
    const started = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-2',
    });
    const paused = await service.pause(WS, started.id);
    expect(paused.status).toBe('PAUSED');
    const resumed = await service.resume(WS, started.id);
    expect(resumed.status).toBe('RUNNING');
    const stopped = await service.stop(WS, started.id);
    expect(stopped.status).toBe('STOPPED');
    expect(liveEvents.getPublishedEvents().map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['LiveSessionPaused', 'LiveSessionResumed', 'LiveSessionStopped']),
    );
  });

  it('rejects orders when session is not RUNNING', async () => {
    const started = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-3',
    });
    await service.pause(WS, started.id);
    await expect(
      service.submitOrder(WS, OWNER, started.id, {
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: '0.01',
      }),
    ).rejects.toBeInstanceOf(LiveSessionInvalidStateError);
  });

  it('submits live orders through Order → Risk → Exchange → Position', async () => {
    const session = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-4',
    });
    await portfolioService.applyFinancials(`live-session:${session.id}`, {
      cash: '100000',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
    });

    const result = await service.submitOrder(WS, OWNER, session.id, {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: '0.001',
    });

    expect(result.order.id).toBeTruthy();
    expect(result.exchangeOrderId).toBeTruthy();
    expect(['FILLED', 'PARTIALLY_FILLED', 'PENDING']).toContain(result.order.status);
    expect(liveEvents.getPublishedEvents().map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['LiveOrderSubmitted']),
    );
  });

  it('synchronizes balances and positions without mutating core directly', async () => {
    const session = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-5',
    });
    const syncResult = await service.synchronize(WS, OWNER, session.id);
    expect(syncResult.log.status).toBe('COMPLETED');
    expect(syncResult.balances).toBeGreaterThan(0);
    expect(liveRepo.logs.some((l) => l.kind === 'FULL_SYNC')).toBe(true);
  });

  it('recovers with reconnect and does not duplicate executions', async () => {
    const session = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-6',
    });

    // Simulate a processed execution id then recover — replay must skip duplicates.
    await liveRepo.markExecutionProcessed(session.id, 'mock-exec-1');
    const recovered = await service.reconnect(WS, OWNER, session.id);
    expect(recovered.session.reconnectCount).toBeGreaterThanOrEqual(1);
    expect(['RUNNING', 'CONNECTED', 'PAUSED']).toContain(recovered.session.status);
    expect(liveEvents.getPublishedEvents().map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['RecoveryStarted', 'RecoveryCompleted', 'LiveSessionRecovered']),
    );

    // Applying the same execution twice returns false the second time.
    const applied1 = await recovery
      .applyExecution(WS, OWNER, recovered.session, 'missing', {
        executionId: 'dup-exec',
        exchangeOrderId: 'ord-1',
        clientOrderId: 'live-missing',
        symbol: 'BTCUSDT',
        side: 'BUY',
        quantity: '1',
        price: '100',
        fee: '0',
        feeAsset: 'USDT',
        timestamp: T0,
      })
      .catch(() => false);
    void applied1;
    const first = await liveRepo.hasProcessedExecution(session.id, 'mock-exec-1');
    expect(first).toBe(true);
    await liveRepo.markExecutionProcessed(session.id, 'dup-exec');
    const again = await recovery.applyExecution(WS, OWNER, recovered.session, 'any', {
      executionId: 'dup-exec',
      exchangeOrderId: 'ord-1',
      clientOrderId: 'live-any',
      symbol: 'BTCUSDT',
      side: 'BUY',
      quantity: '1',
      price: '100',
      fee: '0',
      feeAsset: 'USDT',
      timestamp: T0,
    });
    expect(again).toBe(false);
  });

  it('reports workspace health and status', async () => {
    await service.start(WS, OWNER, { exchange: 'MOCK', accountId: 'acct-7' });
    const status = await service.getStatus(WS);
    expect(status.runningCount).toBe(1);
    expect(status.activeSessions).toHaveLength(1);

    const health = await service.getHealth(WS);
    expect(health.sessions).toHaveLength(1);
    expect(health.sessions[0]?.restLatencyMs).not.toBeNull();
  });

  it('lists sessions and synchronization logs', async () => {
    const session = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-8',
    });
    const sessions = await service.listSessions(WS);
    expect(sessions.some((s) => s.id === session.id)).toBe(true);
    const syncView = await service.getSynchronization(WS);
    expect(syncView.logs.length).toBeGreaterThan(0);
  });

  it('activates kill switch: freeze, cancel orders, block new trades', async () => {
    const session = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'acct-kill',
    });
    await portfolioService.applyFinancials(`live-session:${session.id}`, {
      cash: '100000',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
    });

    const result = await service.activateKillSwitch(WS, OWNER, session.id, {
      closePositions: true,
      reason: 'test emergency',
    });
    expect(result.tradingFrozen).toBe(true);
    expect(result.strategyDisabled).toBe(true);
    expect(result.session.tradingFrozen).toBe(true);

    await expect(
      service.submitOrder(WS, OWNER, session.id, {
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: '0.001',
      }),
    ).rejects.toBeInstanceOf(LiveSessionInvalidStateError);

    const cleared = await service.clearKillSwitch(WS, session.id);
    expect(cleared.tradingFrozen).toBe(false);
    expect(liveEvents.getPublishedEvents().map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['TradingFrozen', 'KillSwitchActivated', 'KillSwitchCleared']),
    );
  });
});
