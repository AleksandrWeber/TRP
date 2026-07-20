/**
 * Application events for US199 Chaos Testing.
 *
 * Collected in-memory by ChaosTestingService. No transport layer.
 */

import type { InjectedFailureType } from './injected-failure-type';

export const CHAOS_TESTING_EVENT_TYPES = Object.freeze([
  'ChaosScenarioStarted',
  'FailureInjected',
  'RecoveryVerified',
  'ChaosScenarioCompleted',
  'ChaosTestingStarted',
  'ChaosTestingCompleted',
] as const);

export type ChaosTestingEventType = (typeof CHAOS_TESTING_EVENT_TYPES)[number];

type ChaosTestingEventBase<Type extends string> = Readonly<{
  eventType: Type;
  suiteId: string;
  occurredAt: string;
}>;

export type ChaosTestingStarted = ChaosTestingEventBase<'ChaosTestingStarted'> &
  Readonly<{
    totalScenarios: number;
  }>;

export type ChaosScenarioStarted = ChaosTestingEventBase<'ChaosScenarioStarted'> &
  Readonly<{
    scenarioId: string;
    scenarioType: string;
    injectedFailure: InjectedFailureType;
  }>;

export type FailureInjected = ChaosTestingEventBase<'FailureInjected'> &
  Readonly<{
    scenarioId: string;
    injectedFailure: InjectedFailureType;
    observedFailure: string;
  }>;

export type RecoveryVerified = ChaosTestingEventBase<'RecoveryVerified'> &
  Readonly<{
    scenarioId: string;
    recoverySucceeded: boolean;
  }>;

export type ChaosScenarioCompleted = ChaosTestingEventBase<'ChaosScenarioCompleted'> &
  Readonly<{
    scenarioId: string;
    success: boolean;
    eventsVerified: boolean;
    cleanupVerified: boolean;
    completedAt: string;
  }>;

export type ChaosTestingCompleted = ChaosTestingEventBase<'ChaosTestingCompleted'> &
  Readonly<{
    scenariosExecuted: number;
    scenariosPassed: number;
    scenariosFailed: number;
    duration: number;
    completedAt: string;
  }>;

export type ChaosTestingEvent =
  | ChaosTestingStarted
  | ChaosScenarioStarted
  | FailureInjected
  | RecoveryVerified
  | ChaosScenarioCompleted
  | ChaosTestingCompleted;
