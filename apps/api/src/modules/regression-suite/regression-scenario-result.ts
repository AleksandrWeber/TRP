import type { RegressionMismatch } from './regression-mismatch';
import type { RegressionScenarioType } from './regression-scenario-type';

/**
 * Immutable per-scenario regression outcome (US198).
 */

export type RegressionScenarioResult = Readonly<{
  scenarioId: string;
  scenarioType: RegressionScenarioType;
  passed: boolean;
  regressionDetected: boolean;
  mismatches: readonly RegressionMismatch[];
  startedAt: string;
  completedAt: string;
  duration: number;
}>;

export function createRegressionScenarioResult(
  properties: RegressionScenarioResult,
): RegressionScenarioResult {
  return Object.freeze({
    scenarioId: required(properties.scenarioId, 'scenarioId'),
    scenarioType: properties.scenarioType,
    passed: properties.passed === true,
    regressionDetected: properties.regressionDetected === true,
    mismatches: Object.freeze([...properties.mismatches]),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
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
