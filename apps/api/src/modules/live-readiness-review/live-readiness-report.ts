import type { OverallReadinessStatus } from './overall-readiness-status';
import {
  createReadinessCategoryResult,
  type ReadinessCategoryResult,
} from './readiness-category-result';
import { deriveOverallReadinessStatus } from './derive-overall-readiness-status';

/**
 * Immutable live readiness review outcome for US200.
 */

export type LiveReadinessReport = Readonly<{
  reviewId: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  overallStatus: OverallReadinessStatus;
  categoryResults: readonly ReadinessCategoryResult[];
  passedChecks: number;
  failedChecks: number;
  warnings: readonly string[];
  recommendations: readonly string[];
}>;

export function createLiveReadinessReport(properties: LiveReadinessReport): LiveReadinessReport {
  const categoryResults = Object.freeze(
    properties.categoryResults.map((result) => createReadinessCategoryResult(result)),
  );
  const warnings = Object.freeze(
    properties.warnings.map((warning) => required(warning, 'warnings')),
  );
  const recommendations = Object.freeze(
    properties.recommendations.map((recommendation) => required(recommendation, 'recommendations')),
  );

  return Object.freeze({
    reviewId: required(properties.reviewId, 'reviewId'),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
    overallStatus: properties.overallStatus,
    categoryResults,
    passedChecks: nonNegativeInteger(properties.passedChecks, 'passedChecks'),
    failedChecks: nonNegativeInteger(properties.failedChecks, 'failedChecks'),
    warnings,
    recommendations,
  });
}

export function aggregateLiveReadinessReport(
  reviewId: string,
  categoryResults: readonly ReadinessCategoryResult[],
  startedAt: string,
  completedAt: string,
): LiveReadinessReport {
  const allChecks = categoryResults.flatMap((result) => result.checks);
  const passedChecks = allChecks.filter((check) => check.passed).length;
  const failedChecks = allChecks.filter((check) => !check.passed && !check.warning).length;
  const warnings = Object.freeze(categoryResults.flatMap((result) => [...result.warnings]));
  const recommendations = Object.freeze(
    categoryResults.flatMap((result) => [...result.recommendations]),
  );
  const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

  return createLiveReadinessReport({
    reviewId,
    startedAt,
    completedAt,
    duration,
    overallStatus: deriveOverallReadinessStatus(categoryResults),
    categoryResults,
    passedChecks,
    failedChecks,
    warnings,
    recommendations,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function canonicalIso(value: string, field: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
