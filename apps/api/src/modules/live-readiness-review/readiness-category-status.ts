/**
 * Category-level readiness status for US200 Live Readiness Review.
 */

import type { ReadinessCheck } from './readiness-check';

export const READINESS_CATEGORY_STATUSES = Object.freeze(['PASSED', 'WARNING', 'FAILED'] as const);

export type ReadinessCategoryStatus = (typeof READINESS_CATEGORY_STATUSES)[number];

export function deriveCategoryStatus(checks: readonly ReadinessCheck[]): ReadinessCategoryStatus {
  const hasFailure = checks.some((check) => !check.passed && !check.warning);
  if (hasFailure) {
    return 'FAILED';
  }

  const hasWarning = checks.some((check) => check.warning);
  if (hasWarning) {
    return 'WARNING';
  }

  return 'PASSED';
}
