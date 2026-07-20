import { FinancialDecimal } from '../financial';
import type {
  RiskActiveOrder,
  RiskOpenPosition,
  RiskOrderRequest,
  RiskPortfolioSnapshot,
} from './domain/risk-evaluation-context';
import type { RiskPolicy } from './domain/risk-policy';
import { createRiskResult, type RiskResult } from './domain/risk-result';
import type { RiskViolation } from './domain/risk-violation';
import { evaluatePolicy } from './position-limit-validator';

/**
 * RiskPolicyEngine — runs enabled policies in priority order (US207).
 * Deterministic: same inputs → same result.
 */
export class RiskPolicyEngine {
  evaluate(input: {
    policies: readonly RiskPolicy[];
    order: RiskOrderRequest;
    portfolio: RiskPortfolioSnapshot;
    openPositions: readonly RiskOpenPosition[];
    activeOrders: readonly RiskActiveOrder[];
  }): RiskResult {
    const sorted = [...input.policies]
      .filter((p) => p.enabled)
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

    const violations: RiskViolation[] = [];
    const warnings: RiskViolation[] = [];

    for (const policy of sorted) {
      const results = evaluatePolicy(policy, {
        order: input.order,
        portfolio: input.portfolio,
        openPositions: input.openPositions,
        activeOrders: input.activeOrders,
      });
      for (const violation of results) {
        if (violation.severity === 'REJECT') {
          violations.push(violation);
        } else {
          warnings.push(violation);
        }
      }
    }

    const score = computeScore(violations, warnings);
    const approved = violations.length === 0;

    return createRiskResult({
      approved,
      violations,
      warnings,
      score,
    });
  }
}

/** Start at 100; −20 per reject violation; −5 per warning; floor at 0. */
function computeScore(
  violations: readonly RiskViolation[],
  warnings: readonly RiskViolation[],
): string {
  let score = FinancialDecimal.from('100');
  for (const _ of violations) {
    score = score.minus('20');
  }
  for (const _ of warnings) {
    score = score.minus('5');
  }
  if (score.isNegative()) return '0';
  return score.toString();
}
