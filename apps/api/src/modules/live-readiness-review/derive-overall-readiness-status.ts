import type { OverallReadinessStatus } from './overall-readiness-status';
import type { ReadinessCategoryResult } from './readiness-category-result';

/**
 * Derives deterministic overall readiness status from category results.
 */
export function deriveOverallReadinessStatus(
  categoryResults: readonly ReadinessCategoryResult[],
): OverallReadinessStatus {
  const hasFailure = categoryResults.some((result) => result.status === 'FAILED');
  if (hasFailure) {
    return 'NOT_READY';
  }

  const hasWarning = categoryResults.some((result) => result.status === 'WARNING');
  if (hasWarning) {
    return 'READY_WITH_WARNINGS';
  }

  return 'READY';
}
