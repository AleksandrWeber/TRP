import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  toDurableEventId,
  TransactionalOutboxAppender,
  type DurableEventEnvelope,
} from '../event-processing';
import {
  evaluateBaselineRisk,
  type BaselineRiskEvaluationInput,
  type RiskDecision,
} from './domain/risk-decision';
import type { BaselineRiskPolicy } from './domain/risk-policy';
import {
  RISK_DECISION_REPOSITORY,
  type RiskDecisionRepository,
} from './persistence/risk-decision.repository';

export const BASELINE_RISK_POLICY = Symbol('BASELINE_RISK_POLICY');

/**
 * Mandatory, durable and explainable M2 pre-trade Risk boundary (US165).
 * It evaluates immutable checkpoint references and never mutates Order,
 * Session, Position, Ledger, Portfolio, or adapter state.
 */
@Injectable()
export class RiskDecisionService {
  constructor(
    @Inject(BASELINE_RISK_POLICY)
    private readonly policy: BaselineRiskPolicy,
    @Inject(RISK_DECISION_REPOSITORY)
    private readonly decisions: RiskDecisionRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async evaluate(input: BaselineRiskEvaluationInput): Promise<RiskDecision> {
    const decision = evaluateBaselineRisk(this.policy, input);
    const existing = await this.decisions.findByIdentity(
      decision.workspaceId,
      decision.orderId,
      decision.policyHash,
      decision.inputHash,
    );
    if (existing) return existing;

    try {
      return await this.transactions.run(async (transaction) => {
        const created = await this.decisions.create(decision, transaction);
        await this.outbox.append(transaction, riskDecisionEnvelope(created), decision.recordedAt);
        return created;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.decisions.findByIdentity(
          decision.workspaceId,
          decision.orderId,
          decision.policyHash,
          decision.inputHash,
        );
        if (raced) return raced;
      }
      throw error;
    }
  }

  get(workspaceId: string, decisionId: string): Promise<RiskDecision | null> {
    return this.decisions.findById(workspaceId, decisionId);
  }
}

function riskDecisionEnvelope(decision: RiskDecision): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`risk-decision:${decision.id}:v1`),
    eventType: decision.status === 'approved' ? 'RiskDecisionApproved' : 'RiskDecisionRejected',
    schemaVersion: 1,
    aggregateType: 'RiskDecision',
    aggregateId: decision.id,
    aggregateVersion: 1,
    workspaceId: decision.workspaceId,
    occurredAt: decision.evaluatedAt,
    recordedAt: decision.recordedAt,
    ...(decision.correlationId !== null ? { correlationId: decision.correlationId } : {}),
    actorId: decision.actorId,
    payload: Object.freeze({
      decisionId: decision.id,
      orderId: decision.orderId,
      intentHash: decision.intentHash,
      status: decision.status,
      policyId: decision.policyId,
      policyVersion: decision.policyVersion,
      policyHash: decision.policyHash,
      inputHash: decision.inputHash,
      reasons: decision.reasons,
      expiresAt: decision.expiresAt,
    }),
  });
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
