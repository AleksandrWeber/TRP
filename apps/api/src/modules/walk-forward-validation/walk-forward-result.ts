import type { ExecutionResult } from '../smoke-backtest';

/**
 * Immutable Walk Forward Validation outcome (US194).
 *
 * Aggregates execution metadata only — no financial metrics.
 */

export type WalkForwardResult = Readonly<{
  executionId: string;
  datasetId: string;
  totalWindows: number;
  completedWindows: number;
  failedWindows: number;
  replayResults: readonly ExecutionResult[];
  startedAt: string;
  completedAt: string;
  duration: number;
}>;

export function createWalkForwardResult(properties: WalkForwardResult): WalkForwardResult {
  return Object.freeze({
    executionId: required(properties.executionId, 'executionId'),
    datasetId: required(properties.datasetId, 'datasetId'),
    totalWindows: nonNegativeInteger(properties.totalWindows, 'totalWindows'),
    completedWindows: nonNegativeInteger(properties.completedWindows, 'completedWindows'),
    failedWindows: nonNegativeInteger(properties.failedWindows, 'failedWindows'),
    replayResults: Object.freeze([...properties.replayResults]),
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
