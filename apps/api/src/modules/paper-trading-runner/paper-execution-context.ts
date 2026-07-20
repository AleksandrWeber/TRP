import { isExecutionMode, type ExecutionMode } from '../trading-session/domain';

/**
 * Immutable snapshot handed to the strategy pipeline on every processing
 * cycle. Carries execution identity only — no market state.
 */
export type PaperExecutionContext = Readonly<{
  sessionId: string;
  executionMode: ExecutionMode;
  startedAt: string;
  cycleNumber: number;
  runtimeId: string;
}>;

export function createPaperExecutionContext(
  properties: PaperExecutionContext,
): PaperExecutionContext {
  return Object.freeze({
    sessionId: required(properties.sessionId, 'sessionId'),
    executionMode: validExecutionMode(properties.executionMode),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    cycleNumber: nonNegativeInteger(properties.cycleNumber, 'cycleNumber'),
    runtimeId: required(properties.runtimeId, 'runtimeId'),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function validExecutionMode(value: ExecutionMode): ExecutionMode {
  if (!isExecutionMode(value)) {
    throw new Error(`Invalid executionMode: ${String(value)}`);
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
