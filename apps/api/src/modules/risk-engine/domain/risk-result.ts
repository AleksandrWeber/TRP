import type { RiskViolation } from './risk-violation';

/**
 * Intermediate policy evaluation result (US207).
 */
export type RiskResult = Readonly<{
  approved: boolean;
  violations: readonly RiskViolation[];
  warnings: readonly RiskViolation[];
  score: string;
}>;

export function createRiskResult(input: {
  approved: boolean;
  violations?: readonly RiskViolation[];
  warnings?: readonly RiskViolation[];
  score: string;
}): RiskResult {
  return Object.freeze({
    approved: input.approved,
    violations: Object.freeze([...(input.violations ?? [])]),
    warnings: Object.freeze([...(input.warnings ?? [])]),
    score: input.score,
  });
}
