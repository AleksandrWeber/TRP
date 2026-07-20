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
import type { RiskDecision } from './domain/risk-decision';
import type { RiskPolicy } from './domain/risk-policy';
import { RiskEventPublisher } from './risk-event-publisher';
import type { RiskDomainEvent } from './risk-events';
import type { RiskRepository } from './risk.repository';
import { RiskService } from './risk.service';

const WS = 'ws-us207';
const OWNER = 'owner-1';
const T0 = '2026-07-20T15:00:00.000Z';

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
  async findById(positionId: string): Promise<Position | null> {
    return this.positions.get(positionId) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Position[]> {
    return [...this.positions.values()]
      .filter((p) => p.portfolioId === portfolioId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    return this.history
      .filter((h) => h.positionId === positionId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<PositionHistory[]> {
    const ids = new Set(
      [...this.positions.values()].filter((p) => p.portfolioId === portfolioId).map((p) => p.id),
    );
    return this.history
      .filter((h) => ids.has(h.positionId))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async appendEvent(event: PositionDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(positionId: string): Promise<PositionDomainEvent[]> {
    return this.events.filter((e) => e.event.positionId === positionId).map((e) => e.event);
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
    return [...this.decisions.values()]
      .filter((d) => d.portfolioId === portfolioId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  async listDecisionsByOrderId(orderId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()]
      .filter((d) => d.orderId === orderId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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
    const rows = [...this.policies.values()].filter((p) =>
      portfolioId === null
        ? p.portfolioId === null
        : p.portfolioId === portfolioId || p.portfolioId === null,
    );
    const byName = new Map<string, RiskPolicy>();
    for (const row of rows) {
      const existing = byName.get(row.name);
      if (!existing || (row.portfolioId !== null && existing.portfolioId === null)) {
        byName.set(row.name, row);
      }
    }
    return [...byName.values()].sort(
      (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
    );
  }
  async appendEvent(event: RiskDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsByDecisionId(decisionId: string): Promise<RiskDomainEvent[]> {
    return this.events.filter((e) => e.event.decisionId === decisionId).map((e) => e.event);
  }
}

function buildRiskService() {
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

  return { riskService, riskRepo, riskEvents, portfolioService, positionService };
}

describe('US207 RiskService', () => {
  let riskService: RiskService;
  let riskRepo: InMemoryRiskRepository;
  let riskEvents: RiskEventPublisher;
  let portfolioService: PortfolioService;

  beforeEach(() => {
    ({ riskService, riskRepo, riskEvents, portfolioService } = buildRiskService());
    riskEvents.clearPublishedEvents();
  });

  it('approves a valid order, persists decision, and publishes events', async () => {
    const evaluation = await riskService.evaluate(WS, OWNER, {
      orderId: 'ord-approve',
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '1',
      requestedPrice: '100',
    });

    expect(evaluation.decision.decision).toBe('APPROVED');
    expect(evaluation.result.approved).toBe(true);
    expect(riskRepo.decisions.size).toBe(1);

    const types = riskEvents.getPublishedEvents().map((e) => e.eventType);
    expect(types).toContain('RiskEvaluationStarted');
    expect(types).toContain('RiskEvaluationCompleted');
    expect(types).toContain('RiskApproved');
  });

  it('rejects when required capital exceeds available balance', async () => {
    await portfolioService.getOrCreate(WS, OWNER);
    await portfolioService.applyFinancials(WS, {
      cash: '10',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
    });

    const evaluation = await riskService.evaluate(WS, OWNER, {
      orderId: 'ord-reject',
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '1',
      requestedPrice: '100',
    });

    expect(evaluation.decision.decision).toBe('REJECTED');
    expect(evaluation.result.violations.some((v) => v.code === 'INSUFFICIENT_BALANCE')).toBe(true);
    expect(riskEvents.getPublishedEvents().map((e) => e.eventType)).toContain('RiskRejected');
  });

  it('lists seeded default policies', async () => {
    const policies = await riskService.listPolicies(WS, OWNER);
    expect(policies.length).toBeGreaterThanOrEqual(7);
    expect(policies.map((p) => p.name)).toContain('portfolio_balance');
  });

  it('updates a policy by cloning global defaults into portfolio scope', async () => {
    const policies = await riskService.listPolicies(WS, OWNER);
    const balance = policies.find((p) => p.name === 'portfolio_balance')!;
    const updated = await riskService.updatePolicy(WS, OWNER, balance.id, {
      enabled: false,
    });
    expect(updated.enabled).toBe(false);
    expect(updated.portfolioId).not.toBeNull();
  });

  it('does not mutate portfolio cash during evaluation', async () => {
    const before = await portfolioService.getOrCreate(WS, OWNER);
    await riskService.evaluate(WS, OWNER, {
      orderId: 'ord-immutable',
      symbol: 'ETH-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1',
    });
    const after = await portfolioService.getPortfolio(WS);
    expect(after.balance.cash).toBe(before.balance.cash);
  });
});
