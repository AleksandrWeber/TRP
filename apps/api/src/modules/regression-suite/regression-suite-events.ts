/**
 * Application events for US198 Regression Suite.
 *
 * Collected in-memory by RegressionSuiteService. No transport layer
 * and no message bus.
 */

export const REGRESSION_SUITE_EVENT_TYPES = Object.freeze([
  'RegressionSuiteStarted',
  'ScenarioPassed',
  'ScenarioFailed',
  'RegressionDetected',
  'RegressionSuiteCompleted',
] as const);

export type RegressionSuiteEventType = (typeof REGRESSION_SUITE_EVENT_TYPES)[number];

type RegressionSuiteEventBase<Type extends string> = Readonly<{
  eventType: Type;
  suiteId: string;
  occurredAt: string;
}>;

export type RegressionSuiteStarted = RegressionSuiteEventBase<'RegressionSuiteStarted'> &
  Readonly<{
    totalScenarios: number;
  }>;

export type ScenarioPassed = RegressionSuiteEventBase<'ScenarioPassed'> &
  Readonly<{
    scenarioId: string;
    duration: number;
    completedAt: string;
  }>;

export type ScenarioFailed = RegressionSuiteEventBase<'ScenarioFailed'> &
  Readonly<{
    scenarioId: string;
    reason: string;
    failedAt: string;
  }>;

export type RegressionDetected = RegressionSuiteEventBase<'RegressionDetected'> &
  Readonly<{
    scenarioId: string;
    mismatchCount: number;
    detectedAt: string;
  }>;

export type RegressionSuiteCompleted = RegressionSuiteEventBase<'RegressionSuiteCompleted'> &
  Readonly<{
    scenariosExecuted: number;
    scenariosPassed: number;
    scenariosFailed: number;
    regressionsDetected: number;
    duration: number;
    completedAt: string;
  }>;

export type RegressionSuiteEvent =
  | RegressionSuiteStarted
  | ScenarioPassed
  | ScenarioFailed
  | RegressionDetected
  | RegressionSuiteCompleted;
