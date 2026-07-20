import { ExecutionStatus, isExecutionStatus } from '../smoke-backtest';
import { isRegressionScenarioType, type RegressionScenarioType } from './regression-scenario-type';

/**
 * Immutable comparable execution snapshot for US198 regression baselines.
 *
 * Duration, sessionId, and timestamps are excluded — duration is informational only.
 */

export type RegressionExpectedResult = Readonly<{
  executionStatus: ExecutionStatus;
  cyclesExecuted: number;
  candlesProcessed: number;
  replayCompleted: boolean;
  datasetId: string | null;
  totalWindows?: number;
  completedWindows?: number;
  failedWindows?: number;
  datasetsProcessed?: number;
  datasetsSucceeded?: number;
  datasetsFailed?: number;
  deterministic?: boolean;
  iterations?: number;
  successfulIterations?: number;
  failedIterations?: number;
}>;

export type RegressionExpectedMetrics = Readonly<{
  cyclesExecuted: number;
  candlesProcessed: number;
  windowsProcessed?: number;
  datasetsProcessed?: number;
  iterations?: number;
}>;

export type RegressionStableEvent = Readonly<Record<string, unknown>>;

/**
 * Immutable regression scenario with in-memory baseline expectations (US198).
 */
export type RegressionScenario = Readonly<{
  scenarioId: string;
  scenarioType: RegressionScenarioType;
  expectedResult: RegressionExpectedResult;
  expectedEvents: readonly RegressionStableEvent[];
  expectedMetrics: RegressionExpectedMetrics;
}>;

export type CreateRegressionScenarioInput = Readonly<{
  scenarioId: string;
  scenarioType: RegressionScenarioType;
  expectedResult: RegressionExpectedResult;
  expectedEvents: readonly RegressionStableEvent[];
  expectedMetrics: RegressionExpectedMetrics;
}>;

export function createRegressionScenario(input: CreateRegressionScenarioInput): RegressionScenario {
  const scenarioId = required(input.scenarioId, 'scenarioId');

  if (!isRegressionScenarioType(input.scenarioType)) {
    throw new Error(`unsupported scenario: ${String(input.scenarioType)}`);
  }

  return Object.freeze({
    scenarioId,
    scenarioType: input.scenarioType,
    expectedResult: validateExpectedResult(input.expectedResult),
    expectedEvents: validateExpectedEvents(input.expectedEvents),
    expectedMetrics: validateExpectedMetrics(input.expectedMetrics),
  });
}

export function validateExpectedResult(value: RegressionExpectedResult): RegressionExpectedResult {
  if (!isExecutionStatus(value.executionStatus)) {
    throw new Error(`invalid expected executionStatus: ${String(value.executionStatus)}`);
  }

  return Object.freeze({
    executionStatus: value.executionStatus,
    cyclesExecuted: nonNegativeInteger(value.cyclesExecuted, 'cyclesExecuted'),
    candlesProcessed: nonNegativeInteger(value.candlesProcessed, 'candlesProcessed'),
    replayCompleted: value.replayCompleted === true,
    datasetId: normalizeDatasetId(value.datasetId),
    totalWindows: optionalNonNegativeInteger(value.totalWindows, 'totalWindows'),
    completedWindows: optionalNonNegativeInteger(value.completedWindows, 'completedWindows'),
    failedWindows: optionalNonNegativeInteger(value.failedWindows, 'failedWindows'),
    datasetsProcessed: optionalNonNegativeInteger(value.datasetsProcessed, 'datasetsProcessed'),
    datasetsSucceeded: optionalNonNegativeInteger(value.datasetsSucceeded, 'datasetsSucceeded'),
    datasetsFailed: optionalNonNegativeInteger(value.datasetsFailed, 'datasetsFailed'),
    deterministic: value.deterministic === undefined ? undefined : value.deterministic === true,
    iterations: optionalPositiveInteger(value.iterations, 'iterations'),
    successfulIterations: optionalNonNegativeInteger(
      value.successfulIterations,
      'successfulIterations',
    ),
    failedIterations: optionalNonNegativeInteger(value.failedIterations, 'failedIterations'),
  });
}

function validateExpectedEvents(
  events: readonly RegressionStableEvent[] | null | undefined,
): readonly RegressionStableEvent[] {
  if (events === null || events === undefined) {
    throw new Error('expectedEvents are required');
  }

  return Object.freeze(
    events.map((event, index) => {
      if (typeof event !== 'object' || event === null) {
        throw new Error(`expectedEvents[${index}] must be an object`);
      }
      if (typeof event.eventType !== 'string' || event.eventType.trim() === '') {
        throw new Error(`expectedEvents[${index}].eventType is required`);
      }
      return Object.freeze({ ...event });
    }),
  );
}

function validateExpectedMetrics(metrics: RegressionExpectedMetrics): RegressionExpectedMetrics {
  return Object.freeze({
    cyclesExecuted: nonNegativeInteger(metrics.cyclesExecuted, 'cyclesExecuted'),
    candlesProcessed: nonNegativeInteger(metrics.candlesProcessed, 'candlesProcessed'),
    windowsProcessed: optionalNonNegativeInteger(metrics.windowsProcessed, 'windowsProcessed'),
    datasetsProcessed: optionalNonNegativeInteger(metrics.datasetsProcessed, 'datasetsProcessed'),
    iterations: optionalPositiveInteger(metrics.iterations, 'iterations'),
  });
}

function normalizeDatasetId(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return required(value, 'datasetId');
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function optionalNonNegativeInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return nonNegativeInteger(value, field);
}

function optionalPositiveInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
