import type { RegressionScenarioResult } from './regression-scenario-result';
import { createRegressionScenarioResult } from './regression-scenario-result';

/**
 * Immutable regression suite outcome (US198).
 */

export type RegressionSuiteResult = Readonly<{
  suiteId: string;
  scenariosExecuted: number;
  scenariosPassed: number;
  scenariosFailed: number;
  regressionsDetected: number;
  scenarioResults: readonly RegressionScenarioResult[];
  startedAt: string;
  completedAt: string;
  duration: number;
}>;

export function createRegressionSuiteResult(
  properties: RegressionSuiteResult,
): RegressionSuiteResult {
  return Object.freeze({
    suiteId: required(properties.suiteId, 'suiteId'),
    scenariosExecuted: nonNegativeInteger(properties.scenariosExecuted, 'scenariosExecuted'),
    scenariosPassed: nonNegativeInteger(properties.scenariosPassed, 'scenariosPassed'),
    scenariosFailed: nonNegativeInteger(properties.scenariosFailed, 'scenariosFailed'),
    regressionsDetected: nonNegativeInteger(properties.regressionsDetected, 'regressionsDetected'),
    scenarioResults: Object.freeze(
      properties.scenarioResults.map((result) => createRegressionScenarioResult(result)),
    ),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
  });
}

export function aggregateRegressionSuiteResult(
  suiteId: string,
  scenarioResults: readonly RegressionScenarioResult[],
  startedAt: string,
  completedAt: string,
): RegressionSuiteResult {
  const scenariosPassed = scenarioResults.filter((result) => result.passed).length;
  const scenariosFailed = scenarioResults.length - scenariosPassed;
  const regressionsDetected = scenarioResults.filter((result) => result.regressionDetected).length;
  const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

  return createRegressionSuiteResult({
    suiteId,
    scenariosExecuted: scenarioResults.length,
    scenariosPassed,
    scenariosFailed,
    regressionsDetected,
    scenarioResults,
    startedAt,
    completedAt,
    duration,
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
