import type { HistoricalReplayEvent } from '../historical-replay';
import { ExecutionStatus, type ExecutionResult } from '../smoke-backtest';
import { createReplayMismatch, type ReplayMismatch } from './replay-mismatch';

/**
 * Stable execution fields compared for determinism (US197).
 *
 * Duration, sessionId, and timestamps are excluded — duration is informational only.
 */
export type ComparableExecutionSnapshot = Readonly<{
  executionStatus: ExecutionStatus;
  cyclesExecuted: number;
  candlesProcessed: number;
  replayCompleted: boolean;
  datasetId: string | null;
}>;

export function comparableExecutionSnapshot(result: ExecutionResult): ComparableExecutionSnapshot {
  return Object.freeze({
    executionStatus: result.executionStatus,
    cyclesExecuted: result.cyclesExecuted,
    candlesProcessed: result.candlesProcessed,
    replayCompleted: result.replayCompleted,
    datasetId: result.datasetId,
  });
}

export function stableReplayEvent(event: HistoricalReplayEvent): Readonly<Record<string, unknown>> {
  const {
    eventType,
    sessionId: _sessionId,
    occurredAt: _occurredAt,
    ...rest
  } = event as HistoricalReplayEvent & Record<string, unknown>;
  return Object.freeze({
    eventType,
    ...rest,
  });
}

export function stableReplayEvents(
  events: readonly HistoricalReplayEvent[],
): readonly Readonly<Record<string, unknown>>[] {
  return Object.freeze(events.map(stableReplayEvent));
}

export function executionOrder(events: readonly HistoricalReplayEvent[]): readonly string[] {
  return Object.freeze(events.map((event) => event.eventType));
}

export function compareReplayToBaseline(
  iteration: number,
  baselineResult: ExecutionResult,
  baselineEvents: readonly HistoricalReplayEvent[],
  candidateResult: ExecutionResult,
  candidateEvents: readonly HistoricalReplayEvent[],
): readonly ReplayMismatch[] {
  const mismatches: ReplayMismatch[] = [];
  const baselineSnapshot = comparableExecutionSnapshot(baselineResult);
  const candidateSnapshot = comparableExecutionSnapshot(candidateResult);

  for (const field of Object.keys(baselineSnapshot) as Array<keyof ComparableExecutionSnapshot>) {
    if (baselineSnapshot[field] !== candidateSnapshot[field]) {
      mismatches.push(
        createReplayMismatch({
          iteration,
          field,
          expected: baselineSnapshot[field],
          actual: candidateSnapshot[field],
        }),
      );
    }
  }

  const baselineOrder = executionOrder(baselineEvents);
  const candidateOrder = executionOrder(candidateEvents);
  if (
    baselineOrder.length !== candidateOrder.length ||
    baselineOrder.some((value, index) => value !== candidateOrder[index])
  ) {
    mismatches.push(
      createReplayMismatch({
        iteration,
        field: 'executionOrder',
        expected: baselineOrder,
        actual: candidateOrder,
      }),
    );
  }

  const baselineStableEvents = stableReplayEvents(baselineEvents);
  const candidateStableEvents = stableReplayEvents(candidateEvents);
  const maxEvents = Math.max(baselineStableEvents.length, candidateStableEvents.length);

  for (let index = 0; index < maxEvents; index += 1) {
    const expected = baselineStableEvents[index] ?? null;
    const actual = candidateStableEvents[index] ?? null;
    if (!deepEqual(expected, actual)) {
      mismatches.push(
        createReplayMismatch({
          iteration,
          field: `applicationEvents[${index}]`,
          expected,
          actual,
        }),
      );
    }
  }

  return Object.freeze(mismatches);
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }
    return left.every((value, index) => deepEqual(value, right[index]));
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(rightRecord, key) &&
      deepEqual(leftRecord[key], rightRecord[key]),
  );
}
