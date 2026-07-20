/**
 * Live readiness review metrics for US200.
 *
 * No financial metrics.
 */

export type LiveReadinessReviewMetrics = Readonly<{
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  reviewDuration: number;
}>;

export function createLiveReadinessReviewMetrics(
  properties: LiveReadinessReviewMetrics,
): LiveReadinessReviewMetrics {
  return Object.freeze({
    totalChecks: nonNegativeInteger(properties.totalChecks, 'totalChecks'),
    passed: nonNegativeInteger(properties.passed, 'passed'),
    failed: nonNegativeInteger(properties.failed, 'failed'),
    warnings: nonNegativeInteger(properties.warnings, 'warnings'),
    reviewDuration: nonNegativeInteger(properties.reviewDuration, 'reviewDuration'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
