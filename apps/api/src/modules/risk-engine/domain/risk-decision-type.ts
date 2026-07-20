/**
 * Risk decision outcomes (US207).
 */
export const RISK_DECISION_TYPES = Object.freeze(['APPROVED', 'REJECTED', 'WARNING'] as const);

export type RiskDecisionType = (typeof RISK_DECISION_TYPES)[number];

export function isRiskDecisionType(value: string): value is RiskDecisionType {
  return (RISK_DECISION_TYPES as readonly string[]).includes(value);
}

export function assertRiskDecisionType(value: string): RiskDecisionType {
  if (!isRiskDecisionType(value)) {
    throw new Error(`invalid risk decision type: ${value}`);
  }
  return value;
}
