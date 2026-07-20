import type { ReadinessCategory } from './readiness-category';
import { createReadinessCheck, type ReadinessCheck } from './readiness-check';
import { deriveCategoryStatus, type ReadinessCategoryStatus } from './readiness-category-status';

/**
 * Immutable category verification outcome for US200 Live Readiness Review.
 */

export type ReadinessCategoryResult = Readonly<{
  category: ReadinessCategory;
  status: ReadinessCategoryStatus;
  checks: readonly ReadinessCheck[];
  warnings: readonly string[];
  recommendations: readonly string[];
}>;

export function createReadinessCategoryResult(
  properties: ReadinessCategoryResult,
): ReadinessCategoryResult {
  const checks = Object.freeze(properties.checks.map((check) => createReadinessCheck(check)));

  return Object.freeze({
    category: properties.category,
    status: properties.status,
    checks,
    warnings: Object.freeze(properties.warnings.map((warning) => required(warning, 'warnings'))),
    recommendations: Object.freeze(
      properties.recommendations.map((recommendation) =>
        required(recommendation, 'recommendations'),
      ),
    ),
  });
}

export function buildReadinessCategoryResult(
  category: ReadinessCategory,
  checks: readonly ReadinessCheck[],
  recommendations: readonly string[] = Object.freeze([]),
): ReadinessCategoryResult {
  const warnings = Object.freeze(
    checks.filter((check) => check.warning).map((check) => check.description),
  );

  return createReadinessCategoryResult({
    category,
    status: deriveCategoryStatus(checks),
    checks,
    warnings,
    recommendations: Object.freeze([...recommendations]),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
