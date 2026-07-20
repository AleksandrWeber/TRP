import type { ExecutionResult } from '../smoke-backtest';
import type { ReplayMismatch } from './replay-mismatch';

/**
 * Immutable Deterministic Replay Validation outcome (US197).
 *
 * Aggregates replay comparison metadata only — no financial metrics.
 */

export type DeterministicReplayValidationResult = Readonly<{
  validationId: string;
  iterations: number;
  successfulIterations: number;
  failedIterations: number;
  deterministic: boolean;
  mismatches: readonly ReplayMismatch[];
  baselineResult: ExecutionResult;
  comparedResults: readonly ExecutionResult[];
  startedAt: string;
  completedAt: string;
  duration: number;
}>;

export function createDeterministicReplayValidationResult(
  properties: DeterministicReplayValidationResult,
): DeterministicReplayValidationResult {
  return Object.freeze({
    validationId: required(properties.validationId, 'validationId'),
    iterations: positiveInteger(properties.iterations, 'iterations'),
    successfulIterations: nonNegativeInteger(
      properties.successfulIterations,
      'successfulIterations',
    ),
    failedIterations: nonNegativeInteger(properties.failedIterations, 'failedIterations'),
    deterministic: properties.deterministic === true,
    mismatches: Object.freeze([...properties.mismatches]),
    baselineResult: properties.baselineResult,
    comparedResults: Object.freeze([...properties.comparedResults]),
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

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
