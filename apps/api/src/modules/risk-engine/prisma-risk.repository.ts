import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { rehydrateRiskDecision, type RiskDecision } from './domain/risk-decision';
import {
  createRiskPolicy,
  isRiskPolicyName,
  type RiskPolicy,
  type RiskPolicyConfiguration,
} from './domain/risk-policy';
import type { RiskDomainEvent, RiskEventType } from './risk-events';
import type { RiskRepository } from './risk.repository';

@Injectable()
export class PrismaRiskRepository implements RiskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createDecision(decision: RiskDecision): Promise<RiskDecision> {
    const row = await this.prisma.tradingRiskDecision.create({
      data: {
        id: decision.id,
        portfolioId: decision.portfolioId,
        orderId: decision.orderId,
        decision: decision.decision,
        reason: decision.reason,
        score: decision.score,
        timestamp: new Date(decision.timestamp),
      },
    });
    return fromDecisionRow(row);
  }

  async findDecisionById(decisionId: string): Promise<RiskDecision | null> {
    const row = await this.prisma.tradingRiskDecision.findUnique({
      where: { id: decisionId },
    });
    return row ? fromDecisionRow(row) : null;
  }

  async listDecisionsByPortfolioId(portfolioId: string): Promise<RiskDecision[]> {
    const rows = await this.prisma.tradingRiskDecision.findMany({
      where: { portfolioId },
      orderBy: { timestamp: 'desc' },
    });
    return rows.map(fromDecisionRow);
  }

  async listDecisionsByOrderId(orderId: string): Promise<RiskDecision[]> {
    const rows = await this.prisma.tradingRiskDecision.findMany({
      where: { orderId },
      orderBy: { timestamp: 'desc' },
    });
    return rows.map(fromDecisionRow);
  }

  async createPolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    const row = await this.prisma.tradingRiskPolicy.create({
      data: {
        id: policy.id,
        portfolioId: policy.portfolioId,
        name: policy.name,
        enabled: policy.enabled,
        priority: policy.priority,
        configuration: policy.configuration as Prisma.InputJsonValue,
      },
    });
    return fromPolicyRow(row);
  }

  async savePolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    const row = await this.prisma.tradingRiskPolicy.update({
      where: { id: policy.id },
      data: {
        enabled: policy.enabled,
        priority: policy.priority,
        configuration: policy.configuration as Prisma.InputJsonValue,
      },
    });
    return fromPolicyRow(row);
  }

  async findPolicyById(policyId: string): Promise<RiskPolicy | null> {
    const row = await this.prisma.tradingRiskPolicy.findUnique({
      where: { id: policyId },
    });
    return row ? fromPolicyRow(row) : null;
  }

  async listPolicies(portfolioId: string | null): Promise<RiskPolicy[]> {
    const rows = await this.prisma.tradingRiskPolicy.findMany({
      where:
        portfolioId === null
          ? { portfolioId: null }
          : { OR: [{ portfolioId }, { portfolioId: null }] },
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
    });
    // Prefer portfolio-specific over global when names collide.
    const byName = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const existing = byName.get(row.name);
      if (!existing) {
        byName.set(row.name, row);
        continue;
      }
      if (row.portfolioId !== null && existing.portfolioId === null) {
        byName.set(row.name, row);
      }
    }
    return [...byName.values()]
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
      .map(fromPolicyRow);
  }

  async appendEvent(event: RiskDomainEvent, eventId: string): Promise<void> {
    await this.prisma.tradingRiskEvent.create({
      data: {
        id: eventId,
        decisionId: 'decisionId' in event ? (event.decisionId ?? null) : null,
        eventType: event.eventType,
        payload: event as unknown as Prisma.InputJsonValue,
        occurredAt: new Date(event.occurredAt),
      },
    });
  }

  async listEventsByDecisionId(decisionId: string): Promise<RiskDomainEvent[]> {
    const rows = await this.prisma.tradingRiskEvent.findMany({
      where: { decisionId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => row.payload as unknown as RiskDomainEvent);
  }
}

type DecisionRow = {
  id: string;
  portfolioId: string;
  orderId: string;
  decision: string;
  reason: string;
  score: string;
  timestamp: Date;
};

type PolicyRow = {
  id: string;
  portfolioId: string | null;
  name: string;
  enabled: boolean;
  priority: number;
  configuration: Prisma.JsonValue;
};

function fromDecisionRow(row: DecisionRow): RiskDecision {
  return rehydrateRiskDecision({
    id: row.id,
    portfolioId: row.portfolioId,
    orderId: row.orderId,
    decision: row.decision,
    reason: row.reason,
    score: row.score,
    timestamp: row.timestamp.toISOString(),
  });
}

function fromPolicyRow(row: PolicyRow): RiskPolicy {
  if (!isRiskPolicyName(row.name)) {
    throw new Error(`persisted risk policy has invalid name: ${row.name}`);
  }
  return createRiskPolicy({
    id: row.id,
    portfolioId: row.portfolioId,
    name: row.name,
    enabled: row.enabled,
    priority: row.priority,
    configuration: (row.configuration ?? {}) as RiskPolicyConfiguration,
  });
}

export type { RiskEventType };
