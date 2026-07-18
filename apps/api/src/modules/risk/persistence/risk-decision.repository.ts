import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { RiskDecision } from '../domain/risk-decision';

export const RISK_DECISION_REPOSITORY = Symbol('RISK_DECISION_REPOSITORY');

export interface RiskDecisionRepository {
  create(decision: RiskDecision, transaction: TransactionContext): Promise<RiskDecision>;
  findById(workspaceId: string, decisionId: string): Promise<RiskDecision | null>;
  findByIdentity(
    workspaceId: string,
    orderId: string,
    policyHash: string,
    inputHash: string,
  ): Promise<RiskDecision | null>;
}
