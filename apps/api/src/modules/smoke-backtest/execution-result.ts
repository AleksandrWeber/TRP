import type { RunnerStatus } from '../paper-trading-runner';

/**
 * Immutable smoke-backtest execution outcome (US191).
 *
 * Never exposes TradingSession aggregates or runner internals beyond status.
 */

export enum ExecutionStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export function isExecutionStatus(value: unknown): value is ExecutionStatus {
  return Object.values(ExecutionStatus).includes(value as ExecutionStatus);
}

export type ExecutionMetrics = Readonly<{
  cyclesExecuted: number;
  executionDuration: number;
  eventsPublished: number;
  errorCount: number;
}>;

export type ExecutionResult = Readonly<{
  sessionId: string;
  runnerStatus: RunnerStatus;
  executionStatus: ExecutionStatus;
  cyclesExecuted: number;
  startedAt: string;
  completedAt: string;
  duration: number;
  eventsPublished: number;
  errors: readonly string[];
  /** US193 historical replay identity; smoke uses a stub marker. */
  datasetId: string | null;
  /** US193 candles consumed during replay; smoke mirrors cyclesExecuted. */
  candlesProcessed: number;
  /** US193 true when the replay stream completed successfully. */
  replayCompleted: boolean;
}>;

export function createExecutionMetrics(properties: ExecutionMetrics): ExecutionMetrics {
  return Object.freeze({
    cyclesExecuted: nonNegativeInteger(properties.cyclesExecuted, 'cyclesExecuted'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
    eventsPublished: nonNegativeInteger(properties.eventsPublished, 'eventsPublished'),
    errorCount: nonNegativeInteger(properties.errorCount, 'errorCount'),
  });
}

export function createExecutionResult(properties: ExecutionResult): ExecutionResult {
  const datasetId =
    properties.datasetId === null || properties.datasetId === undefined
      ? null
      : required(properties.datasetId, 'datasetId');

  return Object.freeze({
    sessionId: required(properties.sessionId, 'sessionId'),
    runnerStatus: properties.runnerStatus,
    executionStatus: validExecutionStatus(properties.executionStatus),
    cyclesExecuted: nonNegativeInteger(properties.cyclesExecuted, 'cyclesExecuted'),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
    eventsPublished: nonNegativeInteger(properties.eventsPublished, 'eventsPublished'),
    errors: Object.freeze([...properties.errors]),
    datasetId,
    candlesProcessed: nonNegativeInteger(properties.candlesProcessed, 'candlesProcessed'),
    replayCompleted: properties.replayCompleted === true,
  });
}

export function metricsFromResult(result: ExecutionResult): ExecutionMetrics {
  return createExecutionMetrics({
    cyclesExecuted: result.cyclesExecuted,
    executionDuration: result.duration,
    eventsPublished: result.eventsPublished,
    errorCount: result.errors.length,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function validExecutionStatus(value: ExecutionStatus): ExecutionStatus {
  if (!isExecutionStatus(value)) {
    throw new Error(`Invalid executionStatus: ${String(value)}`);
  }
  return value;
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
