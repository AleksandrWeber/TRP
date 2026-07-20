/**
 * Immutable chaos scenario outcome (US199).
 */

import type { InjectedFailureType } from './injected-failure-type';

export type ChaosTestResult = Readonly<{
  scenarioId: string;
  injectedFailure: InjectedFailureType;
  expectedFailure: string;
  observedFailure: string | null;
  recoverySucceeded: boolean;
  eventsVerified: boolean;
  cleanupVerified: boolean;
  success: boolean;
}>;

export type CreateChaosTestResultInput = Readonly<{
  scenarioId: string;
  injectedFailure: InjectedFailureType;
  expectedFailure: string;
  observedFailure: string | null;
  recoverySucceeded: boolean;
  eventsVerified: boolean;
  cleanupVerified: boolean;
  success: boolean;
}>;

export function createChaosTestResult(properties: CreateChaosTestResultInput): ChaosTestResult {
  return Object.freeze({
    scenarioId: required(properties.scenarioId, 'scenarioId'),
    injectedFailure: properties.injectedFailure,
    expectedFailure: required(properties.expectedFailure, 'expectedFailure'),
    observedFailure: normalizeObservedFailure(properties.observedFailure),
    recoverySucceeded: properties.recoverySucceeded === true,
    eventsVerified: properties.eventsVerified === true,
    cleanupVerified: properties.cleanupVerified === true,
    success: properties.success === true,
  });
}

export type ChaosTestingSuiteResult = Readonly<{
  suiteId: string;
  scenariosExecuted: number;
  scenariosPassed: number;
  scenariosFailed: number;
  scenarioResults: readonly ChaosTestResult[];
  startedAt: string;
  completedAt: string;
  duration: number;
}>;

export function createChaosTestingSuiteResult(
  properties: ChaosTestingSuiteResult,
): ChaosTestingSuiteResult {
  return Object.freeze({
    suiteId: required(properties.suiteId, 'suiteId'),
    scenariosExecuted: nonNegativeInteger(properties.scenariosExecuted, 'scenariosExecuted'),
    scenariosPassed: nonNegativeInteger(properties.scenariosPassed, 'scenariosPassed'),
    scenariosFailed: nonNegativeInteger(properties.scenariosFailed, 'scenariosFailed'),
    scenarioResults: Object.freeze(
      properties.scenarioResults.map((result) => createChaosTestResult(result)),
    ),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
  });
}

export function aggregateChaosTestingSuiteResult(
  suiteId: string,
  scenarioResults: readonly ChaosTestResult[],
  startedAt: string,
  completedAt: string,
): ChaosTestingSuiteResult {
  const scenariosPassed = scenarioResults.filter((result) => result.success).length;
  const scenariosFailed = scenarioResults.length - scenariosPassed;
  const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

  return createChaosTestingSuiteResult({
    suiteId,
    scenariosExecuted: scenarioResults.length,
    scenariosPassed,
    scenariosFailed,
    scenarioResults,
    startedAt,
    completedAt,
    duration,
  });
}

function normalizeObservedFailure(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
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
