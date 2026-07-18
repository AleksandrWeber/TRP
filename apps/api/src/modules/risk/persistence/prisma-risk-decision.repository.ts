import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  RiskDecisionStatus,
  type BaselineRiskEvaluationInput,
  type RiskDecision,
  type RiskRuleResult,
} from '../domain/risk-decision';
import type { RiskDecisionRepository } from './risk-decision.repository';

type StoredRiskDecision = Prisma.RiskDecisionGetPayload<object>;

export class PrismaRiskDecisionRepository implements RiskDecisionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(decision: RiskDecision, transaction: TransactionContext): Promise<RiskDecision> {
    const client = prismaClientForTransaction(transaction);
    await client.riskDecision.create({
      data: {
        id: decision.id,
        workspaceId: decision.workspaceId,
        orderId: decision.orderId,
        intentHash: decision.intentHash,
        status: decision.status,
        policyId: decision.policyId,
        policyVersion: decision.policyVersion,
        policyHash: decision.policyHash,
        inputHash: decision.inputHash,
        input: decision.input as unknown as Prisma.InputJsonValue,
        ruleResults: decision.ruleResults as unknown as Prisma.InputJsonValue,
        reasons: decision.reasons as unknown as Prisma.InputJsonValue,
        evaluatedAt: new Date(decision.evaluatedAt),
        expiresAt: new Date(decision.expiresAt),
        recordedAt: new Date(decision.recordedAt),
        actorId: decision.actorId,
        correlationId: decision.correlationId,
      },
    });
    return decision;
  }

  async findById(workspaceId: string, decisionId: string): Promise<RiskDecision | null> {
    const stored = await this.prisma.riskDecision.findFirst({
      where: { id: decisionId, workspaceId },
    });
    return stored ? toDomain(stored) : null;
  }

  async findByIdentity(
    workspaceId: string,
    orderId: string,
    policyHash: string,
    inputHash: string,
  ): Promise<RiskDecision | null> {
    const stored = await this.prisma.riskDecision.findUnique({
      where: {
        workspaceId_orderId_policyHash_inputHash: {
          workspaceId,
          orderId,
          policyHash,
          inputHash,
        },
      },
    });
    return stored ? toDomain(stored) : null;
  }
}

function toDomain(stored: StoredRiskDecision): RiskDecision {
  if (!Object.values(RiskDecisionStatus).includes(stored.status as RiskDecisionStatus)) {
    throw new Error(`unsupported Risk Decision status: ${stored.status}`);
  }
  const ruleResults = stored.ruleResults as unknown;
  const reasons = stored.reasons as unknown;
  if (!Array.isArray(ruleResults) || !Array.isArray(reasons)) {
    throw new Error('persisted Risk Decision explanation is invalid');
  }
  return Object.freeze({
    id: stored.id,
    workspaceId: stored.workspaceId,
    orderId: stored.orderId,
    intentHash: stored.intentHash,
    status: stored.status as RiskDecisionStatus,
    policyId: stored.policyId,
    policyVersion: stored.policyVersion,
    policyHash: stored.policyHash,
    inputHash: stored.inputHash,
    input: deepFreeze(stored.input as unknown as BaselineRiskEvaluationInput),
    ruleResults: deepFreeze(ruleResults as RiskRuleResult[]),
    reasons: deepFreeze(reasons as string[]),
    evaluatedAt: stored.evaluatedAt.toISOString(),
    expiresAt: stored.expiresAt.toISOString(),
    recordedAt: stored.recordedAt.toISOString(),
    actorId: stored.actorId,
    correlationId: stored.correlationId,
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
