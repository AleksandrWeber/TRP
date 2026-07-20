import { createRiskDecision, type RiskDecision } from './domain/risk-decision';
import type { RiskDecisionType } from './domain/risk-decision-type';
import type {
  RiskActiveOrder,
  RiskOpenPosition,
  RiskOrderRequest,
  RiskPortfolioSnapshot,
} from './domain/risk-evaluation-context';
import type { RiskPolicy } from './domain/risk-policy';
import type { RiskResult } from './domain/risk-result';
import { RiskPolicyEngine } from './risk-policy-engine';

export type RiskEvaluationOutcome = Readonly<{
  decision: RiskDecision;
  result: RiskResult;
}>;

/**
 * RiskEvaluator — builds immutable RiskDecision from policy results (US207).
 */
export class RiskEvaluator {
  private readonly policyEngine = new RiskPolicyEngine();

  evaluate(input: {
    decisionId: string;
    order: RiskOrderRequest;
    portfolio: RiskPortfolioSnapshot;
    openPositions: readonly RiskOpenPosition[];
    activeOrders: readonly RiskActiveOrder[];
    policies: readonly RiskPolicy[];
    timestamp: string;
  }): RiskEvaluationOutcome {
    const result = this.policyEngine.evaluate({
      policies: input.policies,
      order: input.order,
      portfolio: input.portfolio,
      openPositions: input.openPositions,
      activeOrders: input.activeOrders,
    });

    const decisionType = toDecisionType(result);
    const reason = buildReason(result, decisionType);

    const decision = createRiskDecision({
      id: input.decisionId,
      portfolioId: input.order.portfolioId,
      orderId: input.order.id,
      decision: decisionType,
      reason,
      score: result.score,
      timestamp: input.timestamp,
    });

    return Object.freeze({ decision, result });
  }
}

function toDecisionType(result: RiskResult): RiskDecisionType {
  if (!result.approved) return 'REJECTED';
  if (result.warnings.length > 0) return 'WARNING';
  return 'APPROVED';
}

function buildReason(result: RiskResult, decision: RiskDecisionType): string {
  if (decision === 'APPROVED') return 'all risk policies passed';
  if (decision === 'WARNING') {
    return result.warnings.map((w) => w.message).join('; ') || 'risk warnings present';
  }
  return result.violations.map((v) => v.message).join('; ') || 'risk policies rejected';
}
