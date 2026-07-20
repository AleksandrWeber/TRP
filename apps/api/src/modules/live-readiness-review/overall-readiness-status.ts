/**
 * Overall readiness status for US200 Live Readiness Review.
 */

export const OVERALL_READINESS_STATUSES = Object.freeze([
  'READY',
  'READY_WITH_WARNINGS',
  'NOT_READY',
] as const);

export type OverallReadinessStatus = (typeof OVERALL_READINESS_STATUSES)[number];

export function isOverallReadinessStatus(value: unknown): value is OverallReadinessStatus {
  return (
    typeof value === 'string' && (OVERALL_READINESS_STATUSES as readonly string[]).includes(value)
  );
}
