/**
 * V3-S06-a — Isolation Evidence types.
 * Every isolation claim must name Static, Runtime, or Regression evidence.
 * A bare "PASS" without evidence type is not valid proof.
 */
export const IsolationEvidenceType = {
  Static: 'static',
  Runtime: 'runtime',
  Regression: 'regression',
} as const;

export type IsolationEvidenceType =
  (typeof IsolationEvidenceType)[keyof typeof IsolationEvidenceType];

/** Product Owner-visible completeness state for a matrix row. */
export const IsolationMatrixExecutionStatus = {
  Pending: 'pending',
  Pass: 'pass',
  NotApplicable: 'not-applicable',
} as const;

export type IsolationMatrixExecutionStatus =
  (typeof IsolationMatrixExecutionStatus)[keyof typeof IsolationMatrixExecutionStatus];

export type IsolationEvidenceRecord = Readonly<{
  types: readonly IsolationEvidenceType[];
  /** Human-readable proof story for reports and matrix tracking. */
  proofStory: string;
}>;
