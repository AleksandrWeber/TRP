/**
 * US210 — Live Trading API response schema contract.
 */
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Portfolio } from '../../modules/portfolio-engine/domain/portfolio';
import type { PortfolioSnapshot } from '../../modules/portfolio-engine/domain/portfolio-snapshot';
import { PortfolioEventPublisher } from '../../modules/portfolio-engine/portfolio-event-publisher';
import type { PortfolioDomainEvent } from '../../modules/portfolio-engine/portfolio-events';
import type { PortfolioRepository } from '../../modules/portfolio-engine/portfolio.repository';
import { PortfolioService } from '../../modules/portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../../modules/portfolio-engine/portfolio-snapshot.service';
import type { Position } from '../../modules/position-engine/domain/position';
import type { PositionHistory } from '../../modules/position-engine/domain/position-history';
import { PositionEventPublisher } from '../../modules/position-engine/position-event-publisher';
import type { PositionDomainEvent } from '../../modules/position-engine/position-events';
import { PositionHistoryService } from '../../modules/position-engine/position-history.service';
import type { PositionRepository } from '../../modules/position-engine/position.repository';
import { PositionService } from '../../modules/position-engine/position.service';
import type { Order } from '../../modules/order-engine/domain/order';
import type { OrderFill } from '../../modules/order-engine/domain/order-fill';
import type { OrderHistory } from '../../modules/order-engine/domain/order-history';
import { OrderEventPublisher } from '../../modules/order-engine/order-event-publisher';
import type { OrderDomainEvent } from '../../modules/order-engine/order-events';
import { OrderExecutionService } from '../../modules/order-engine/order-execution.service';
import { OrderFillService } from '../../modules/order-engine/order-fill.service';
import { OrderHistoryService } from '../../modules/order-engine/order-history.service';
import type { OrderRepository } from '../../modules/order-engine/order.repository';
import { OrderService } from '../../modules/order-engine/order.service';
import type { RiskDecision } from '../../modules/risk-engine/domain/risk-decision';
import type { RiskPolicy } from '../../modules/risk-engine/domain/risk-policy';
import { RiskEventPublisher } from '../../modules/risk-engine/risk-event-publisher';
import type { RiskDomainEvent } from '../../modules/risk-engine/risk-events';
import type { RiskRepository } from '../../modules/risk-engine/risk.repository';
import { RiskService } from '../../modules/risk-engine/risk.service';
import type { ExchangeConnection } from '../../modules/exchange-adapter/domain/exchange-connection';
import type { ExchangeDomainEvent } from '../../modules/exchange-adapter/exchange-adapter-events';
import type { ExchangeAdapterRepository } from '../../modules/exchange-adapter/exchange-adapter.repository';
import { ExchangeAdapterService } from '../../modules/exchange-adapter/exchange-adapter.service';
import { ExchangeEventPublisher } from '../../modules/exchange-adapter/exchange-event-publisher';
import { ExchangeFactory } from '../../modules/exchange-adapter/exchange-factory';
import { ExchangeManager } from '../../modules/exchange-adapter/exchange-manager';
import { ExchangeRegistry } from '../../modules/exchange-adapter/exchange-registry';
import { ExchangeRouter } from '../../modules/exchange-adapter/exchange-router';
import type { LiveEventRecord } from '../../modules/live-trading-engine/domain/live-event';
import type { LiveSession } from '../../modules/live-trading-engine/domain/live-session';
import type { SynchronizationLog } from '../../modules/live-trading-engine/domain/synchronization-log';
import { ConnectionSupervisor } from '../../modules/live-trading-engine/connection-supervisor';
import { HealthMonitor } from '../../modules/live-trading-engine/health-monitor';
import { LiveEventPublisher } from '../../modules/live-trading-engine/live-event-publisher';
import { LiveExecutionCoordinator } from '../../modules/live-trading-engine/live-execution-coordinator';
import { LiveSessionManager } from '../../modules/live-trading-engine/live-session-manager';
import type { LiveTradingDomainEvent } from '../../modules/live-trading-engine/live-trading-events';
import type { LiveTradingRepository } from '../../modules/live-trading-engine/live-trading.repository';
import { LiveTradingService } from '../../modules/live-trading-engine/live-trading.service';
import { RecoveryManager } from '../../modules/live-trading-engine/recovery-manager';
import { EmergencyManager } from '../../modules/live-trading-engine/emergency-manager';
import { SynchronizationManager } from '../../modules/live-trading-engine/synchronization-manager';

const WS = 'ws-us210-contract';
const OWNER = 'owner-contract';
const T0 = '2026-07-20T18:30:00.000Z';

class MemoryPortfolioRepo implements PortfolioRepository {
  portfolios = new Map<string, Portfolio>();
  snapshots: PortfolioSnapshot[] = [];
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
  async findById(id: string): Promise<Portfolio | null> {
    return this.portfolios.get(id) ?? null;
  }
  async createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    this.snapshots.push(snapshot);
    return snapshot;
  }
  async listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    return this.snapshots.filter((s) => s.portfolioId === portfolioId);
  }
  async appendEvent(_event: PortfolioDomainEvent, _eventId: string): Promise<void> {}
  async listEvents(): Promise<PortfolioDomainEvent[]> {
    return [];
  }
}

class MemoryPositionRepo implements PositionRepository {
  positions = new Map<string, Position>();
  history: PositionHistory[] = [];
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
  async listHistoryByPortfolioId(): Promise<PositionHistory[]> {
    return this.history;
  }
  async appendEvent(_event: PositionDomainEvent, _eventId: string): Promise<void> {}
  async listEvents(): Promise<PositionDomainEvent[]> {
    return [];
  }
}

class MemoryOrderRepo implements OrderRepository {
  orders = new Map<string, Order>();
  fills: OrderFill[] = [];
  history: OrderHistory[] = [];
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
  async listHistoryByPortfolioId(): Promise<OrderHistory[]> {
    return this.history;
  }
  async appendEvent(_event: OrderDomainEvent, _eventId: string): Promise<void> {}
  async listEvents(): Promise<OrderDomainEvent[]> {
    return [];
  }
}

class MemoryRiskRepo implements RiskRepository {
  decisions = new Map<string, RiskDecision>();
  policies = new Map<string, RiskPolicy>();
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
  async listPolicies(): Promise<RiskPolicy[]> {
    return [...this.policies.values()];
  }
  async appendEvent(_event: RiskDomainEvent, _eventId: string): Promise<void> {}
  async listEventsByDecisionId(): Promise<RiskDomainEvent[]> {
    return [];
  }
}

class MemoryExchangeRepo implements ExchangeAdapterRepository {
  connections = new Map<string, ExchangeConnection>();
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
  async appendEvent(_event: ExchangeDomainEvent, _eventId: string): Promise<void> {}
  async listEventsByConnectionId(): Promise<ExchangeDomainEvent[]> {
    return [];
  }
}

class MemoryLiveRepo implements LiveTradingRepository {
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
    return [...this.sessions.values()].filter((s) => s.workspaceId === workspaceId);
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

function buildService(): LiveTradingService {
  const portfolioRepo = new MemoryPortfolioRepo();
  const portfolioEvents = new PortfolioEventPublisher(portfolioRepo);
  const snapshots = new PortfolioSnapshotService(portfolioRepo, portfolioEvents);
  const portfolios = new PortfolioService(portfolioRepo, snapshots, portfolioEvents, {
    get: () => 'development',
  } as unknown as ConfigService);
  portfolios.setClock({ now: () => new Date(T0), iso: () => T0 });

  const positionRepo = new MemoryPositionRepo();
  const positionEvents = new PositionEventPublisher(positionRepo);
  const positionHistory = new PositionHistoryService(positionRepo);
  const positions = new PositionService(positionRepo, positionHistory, positionEvents, portfolios);
  positions.setClock({ now: () => new Date(T0), iso: () => T0 });

  const riskRepo = new MemoryRiskRepo();
  const riskEvents = new RiskEventPublisher(riskRepo);
  const risk = new RiskService(riskRepo, riskEvents, portfolios, positions);
  risk.setClock({ now: () => new Date(T0), iso: () => T0 });

  const orderRepo = new MemoryOrderRepo();
  const orderEvents = new OrderEventPublisher(orderRepo);
  const orderHistory = new OrderHistoryService(orderRepo, orderEvents);
  const fills = new OrderFillService(orderRepo);
  const execution = new OrderExecutionService(
    orderRepo,
    fills,
    orderHistory,
    orderEvents,
    positions,
    portfolios,
  );
  const orders = new OrderService(
    orderRepo,
    orderHistory,
    orderEvents,
    fills,
    execution,
    portfolios,
    risk,
  );
  orders.setClock({ now: () => new Date(T0), iso: () => T0 });

  const exchangeRepo = new MemoryExchangeRepo();
  const registry = new ExchangeRegistry();
  const factory = new ExchangeFactory(registry);
  const router = new ExchangeRouter(registry);
  const exchangeEvents = new ExchangeEventPublisher(exchangeRepo);
  const manager = new ExchangeManager(factory, registry, router, exchangeEvents, exchangeRepo);
  manager.setClock({ now: () => T0 });
  manager.onModuleInit();
  const exchanges = new ExchangeAdapterService(manager);

  const liveRepo = new MemoryLiveRepo();
  const liveEvents = new LiveEventPublisher(liveRepo);
  const sessions = new LiveSessionManager(liveRepo, liveEvents, portfolios);
  sessions.setClock({ now: () => new Date(T0), iso: () => T0 });
  const connections = new ConnectionSupervisor(sessions, exchanges, liveEvents);
  const sync = new SynchronizationManager(
    liveRepo,
    sessions,
    liveEvents,
    exchanges,
    orders,
    positions,
  );
  const recovery = new RecoveryManager(
    liveRepo,
    sessions,
    liveEvents,
    connections,
    sync,
    exchanges,
    orders,
  );
  const emergency = new EmergencyManager(liveRepo, sessions, liveEvents, orders, positions);
  const health = new HealthMonitor(sessions, connections, sync, liveEvents);
  const coordinator = new LiveExecutionCoordinator(
    sessions,
    liveEvents,
    orders,
    exchanges,
    recovery,
    health,
  );
  return new LiveTradingService(
    sessions,
    connections,
    sync,
    recovery,
    emergency,
    health,
    coordinator,
    liveEvents,
    liveRepo,
    orders,
    positions,
    portfolios,
  );
}

function assertSessionShape(session: Record<string, unknown>) {
  expect(session).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      exchange: expect.any(String),
      accountId: expect.any(String),
      status: expect.any(String),
      reconnectCount: expect.any(Number),
      synchronizationState: expect.any(String),
      portfolioId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }),
  );
}

describe('US210 Live Trading API contract', () => {
  it('GET/POST live session, status, health, synchronization shapes', async () => {
    const service = buildService();
    const started = await service.start(WS, OWNER, {
      exchange: 'MOCK',
      accountId: 'contract-acct',
    });
    assertSessionShape(started as unknown as Record<string, unknown>);

    const sessions = await service.listSessions(WS);
    expect(Array.isArray(sessions)).toBe(true);
    assertSessionShape(sessions[0] as unknown as Record<string, unknown>);

    const status = await service.getStatus(WS);
    expect(status).toEqual(
      expect.objectContaining({
        activeSessions: expect.any(Array),
        totalSessions: expect.any(Number),
        runningCount: expect.any(Number),
      }),
    );

    const health = await service.getHealth(WS);
    expect(health).toEqual(
      expect.objectContaining({
        sessions: expect.any(Array),
        alerts: expect.any(Array),
        healthy: expect.any(Boolean),
        sampledAt: expect.any(String),
      }),
    );

    const sync = await service.getSynchronization(WS);
    expect(sync).toEqual(
      expect.objectContaining({
        logs: expect.any(Array),
        sessions: expect.any(Array),
      }),
    );

    const syncResult = await service.synchronize(WS, OWNER, started.id);
    expect(syncResult).toEqual(
      expect.objectContaining({
        session: expect.any(Object),
        log: expect.any(Object),
        inconsistencies: expect.any(Array),
        balances: expect.any(Number),
        positions: expect.any(Number),
        openOrders: expect.any(Number),
      }),
    );

    const paused = await service.pause(WS, started.id);
    expect(paused.status).toBe('PAUSED');
    const resumed = await service.resume(WS, started.id);
    expect(resumed.status).toBe('RUNNING');
    const stopped = await service.stop(WS, started.id);
    expect(stopped.status).toBe('STOPPED');
  });
});
