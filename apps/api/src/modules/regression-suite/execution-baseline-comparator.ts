import type { RegressionMismatch } from './regression-mismatch';
import { createRegressionMismatch } from './regression-mismatch';
import type {
  RegressionExpectedMetrics,
  RegressionExpectedResult,
  RegressionStableEvent,
} from './regression-scenario';

/**
 * Actual execution baseline captured from a regression scenario run (US198).
 */
export type ExecutionBaseline = Readonly<{
  result: RegressionExpectedResult;
  events: readonly RegressionStableEvent[];
  metrics: RegressionExpectedMetrics;
}>;

export type CompareExecutionBaselineInput = Readonly<{
  scenarioId: string;
  expected: ExecutionBaseline;
  actual: ExecutionBaseline;
}>;

/**
 * Compares execution outputs against expected baselines (US198).
 *
 * Compares execution result, events, metrics, and execution order.
 * Execution duration is informational only and excluded from comparison.
 */
export class ExecutionBaselineComparator {
  compare(input: CompareExecutionBaselineInput): readonly RegressionMismatch[] {
    const mismatches: RegressionMismatch[] = [];
    const { scenarioId, expected, actual } = input;

    for (const field of Object.keys(expected.result) as Array<keyof RegressionExpectedResult>) {
      const expectedValue = expected.result[field];
      const actualValue = actual.result[field];
      if (expectedValue !== actualValue) {
        mismatches.push(
          createRegressionMismatch({
            scenarioId,
            field: String(field),
            expected: expectedValue,
            actual: actualValue,
          }),
        );
      }
    }

    const expectedOrder = executionOrder(expected.events);
    const actualOrder = executionOrder(actual.events);
    if (
      expectedOrder.length !== actualOrder.length ||
      expectedOrder.some((value, index) => value !== actualOrder[index])
    ) {
      mismatches.push(
        createRegressionMismatch({
          scenarioId,
          field: 'executionOrder',
          expected: expectedOrder,
          actual: actualOrder,
        }),
      );
    }

    const maxEvents = Math.max(expected.events.length, actual.events.length);
    for (let index = 0; index < maxEvents; index += 1) {
      const expectedEvent = expected.events[index] ?? null;
      const actualEvent = actual.events[index] ?? null;
      if (!deepEqual(expectedEvent, actualEvent)) {
        mismatches.push(
          createRegressionMismatch({
            scenarioId,
            field: `applicationEvents[${index}]`,
            expected: expectedEvent,
            actual: actualEvent,
          }),
        );
      }
    }

    for (const field of Object.keys(expected.metrics) as Array<keyof RegressionExpectedMetrics>) {
      const expectedValue = expected.metrics[field];
      const actualValue = actual.metrics[field];
      if (expectedValue !== actualValue) {
        mismatches.push(
          createRegressionMismatch({
            scenarioId,
            field: `metrics.${String(field)}`,
            expected: expectedValue,
            actual: actualValue,
          }),
        );
      }
    }

    return Object.freeze(mismatches);
  }
}

export function executionOrder(events: readonly RegressionStableEvent[]): readonly string[] {
  return Object.freeze(
    events.map((event) => {
      const eventType = event.eventType;
      return typeof eventType === 'string' ? eventType : String(eventType);
    }),
  );
}

export function stableApplicationEvent(
  event: Readonly<Record<string, unknown>>,
): RegressionStableEvent {
  const {
    eventType,
    sessionId: _sessionId,
    occurredAt: _occurredAt,
    completedAt: _completedAt,
    failedAt: _failedAt,
    finishedAt: _finishedAt,
    executionId: _executionId,
    researchId: _researchId,
    validationId: _validationId,
    ...rest
  } = event;
  return Object.freeze({
    eventType,
    ...rest,
  });
}

export function stableApplicationEvents(
  events: readonly Readonly<Record<string, unknown>>[],
): readonly RegressionStableEvent[] {
  return Object.freeze(events.map(stableApplicationEvent));
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

export const executionBaselineComparator = new ExecutionBaselineComparator();
