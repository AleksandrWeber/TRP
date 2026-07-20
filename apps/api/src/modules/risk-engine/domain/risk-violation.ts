/**
 * Risk violation severity (US207).
 */
export const RISK_VIOLATION_SEVERITIES = Object.freeze(['REJECT', 'WARNING'] as const);

export type RiskViolationSeverity = (typeof RISK_VIOLATION_SEVERITIES)[number];

export type RiskViolation = Readonly<{
  code: string;
  severity: RiskViolationSeverity;
  message: string;
}>;

export function createRiskViolation(input: {
  code: string;
  severity: RiskViolationSeverity;
  message: string;
}): RiskViolation {
  return Object.freeze({
    code: input.code,
    severity: input.severity,
    message: input.message,
  });
}
