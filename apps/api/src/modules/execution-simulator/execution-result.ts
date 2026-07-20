import type { ExecutionFill } from './execution-fill';

/**
 * Immutable execution simulation outcome for US201 Execution Simulator.
 *
 * Wraps the produced fill and execution metadata. No portfolio or position state.
 */
export type ExecutionResult = Readonly<{
  requestId: string;
  fill: ExecutionFill;
  commission: number;
  startedAt: string;
  completedAt: string;
  executionDuration: number;
}>;

export function createExecutionResult(properties: ExecutionResult): ExecutionResult {
  return Object.freeze({
    requestId: required(properties.requestId, 'requestId'),
    fill: properties.fill,
    commission: nonNegativeNumber(properties.commission, 'commission'),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
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
