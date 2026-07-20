import type { ReadinessCategory } from './readiness-category';
import type { ReadinessCheck } from './readiness-check';

/**
 * Recommendation generation for US200 Live Readiness Review.
 */

const CATEGORY_RECOMMENDATIONS: Readonly<Record<ReadinessCategory, readonly string[]>> =
  Object.freeze({
    Execution: Object.freeze([
      'Verify all execution services are registered and can complete a smoke cycle.',
    ]),
    Determinism: Object.freeze([
      'Resolve deterministic replay mismatches before enabling live trading.',
    ]),
    Performance: Object.freeze(['Ensure benchmark suite passes to confirm performance baselines.']),
    Regression: Object.freeze(['Fix regression suite failures to protect execution baselines.']),
    Chaos: Object.freeze([
      'Address chaos testing failures to confirm resilience under injected faults.',
    ]),
    Diagnostics: Object.freeze([
      'Confirm diagnostics and event emission infrastructure are fully operational.',
    ]),
    Configuration: Object.freeze([
      'Validate predefined configurations and deterministic datasets.',
    ]),
    Architecture: Object.freeze([
      'Restore architecture consistency across execution and orchestration layers.',
    ]),
  });

export function generateCategoryRecommendations(
  category: ReadinessCategory,
  checks: readonly ReadinessCheck[],
): readonly string[] {
  const failedChecks = checks.filter((check) => !check.passed && !check.warning);
  if (failedChecks.length === 0) {
    return Object.freeze([]);
  }

  const recommendations = [
    ...CATEGORY_RECOMMENDATIONS[category],
    ...failedChecks.map((check) => `Failed check ${check.checkId}: ${check.description}`),
  ];

  return Object.freeze([...new Set(recommendations)]);
}

export function generateWarningRecommendations(
  category: ReadinessCategory,
  checks: readonly ReadinessCheck[],
): readonly string[] {
  const warningChecks = checks.filter((check) => check.warning);
  if (warningChecks.length === 0) {
    return Object.freeze([]);
  }

  return Object.freeze(
    warningChecks.map(
      (check) =>
        `[${category}] Warning for ${check.checkId}: consider addressing ${check.description}`,
    ),
  );
}
