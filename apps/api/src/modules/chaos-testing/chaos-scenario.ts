import { isChaosScenarioType, type ChaosScenarioType } from './chaos-scenario-type';
import { isInjectedFailureType, type InjectedFailureType } from './injected-failure-type';

/**
 * Immutable chaos scenario definition (US199).
 */
export type ChaosScenario = Readonly<{
  scenarioId: string;
  scenarioType: ChaosScenarioType;
  injectedFailure: InjectedFailureType;
  expectedFailure: string;
  expectedFailedEventType: string;
  clockTimes?: readonly string[];
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

export type CreateChaosScenarioInput = Readonly<{
  scenarioId: string;
  scenarioType: ChaosScenarioType;
  injectedFailure: InjectedFailureType;
  expectedFailure: string;
  expectedFailedEventType: string;
  clockTimes?: readonly string[];
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

export function createChaosScenario(input: CreateChaosScenarioInput): ChaosScenario {
  const scenarioId = required(input.scenarioId, 'scenarioId');

  if (!isChaosScenarioType(input.scenarioType)) {
    throw new Error(`unsupported scenario: ${String(input.scenarioType)}`);
  }

  if (!isInjectedFailureType(input.injectedFailure)) {
    throw new Error(`unsupported injected failure: ${String(input.injectedFailure)}`);
  }

  const expectedFailure = required(input.expectedFailure, 'expectedFailure');
  const expectedFailedEventType = required(
    input.expectedFailedEventType,
    'expectedFailedEventType',
  );

  return Object.freeze({
    scenarioId,
    scenarioType: input.scenarioType,
    injectedFailure: input.injectedFailure,
    expectedFailure,
    expectedFailedEventType,
    clockTimes:
      input.clockTimes === undefined
        ? undefined
        : Object.freeze(
            input.clockTimes.map((timestamp, index) =>
              canonicalIso(timestamp, `clockTimes[${index}]`),
            ),
          ),
    leaseDurationMs: optionalPositiveInteger(input.leaseDurationMs, 'leaseDurationMs'),
    heartbeatTimeoutMs: optionalPositiveInteger(input.heartbeatTimeoutMs, 'heartbeatTimeoutMs'),
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

function optionalPositiveInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
