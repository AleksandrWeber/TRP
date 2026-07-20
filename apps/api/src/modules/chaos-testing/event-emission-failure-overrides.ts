import {
  createFailingApplicationEventNotifier,
  type ApplicationEventNotifier,
} from '../research-api';

export const EVENT_EMISSION_FAILURE_MESSAGE = 'event emission failure';

export const SMOKE_COMPLETION_EVENT = 'SmokeBacktestCompleted';
export const HISTORICAL_REPLAY_COMPLETION_EVENTS = Object.freeze([
  'HistoricalReplayCompleted',
  'HistoricalReplayFinished',
]);
export const WALK_FORWARD_COMPLETION_EVENTS = Object.freeze([
  'WalkForwardWindowCompleted',
  'WalkForwardCompleted',
]);
export const MULTI_YEAR_COMPLETION_EVENTS = Object.freeze([
  'DatasetCompleted',
  'MultiYearResearchCompleted',
]);
export const DETERMINISTIC_COMPLETION_EVENTS = Object.freeze([
  'ReplayCompared',
  'DeterministicValidationCompleted',
]);

export function createEventEmissionFailingNotifier<T extends { eventType: string }>(
  failOnEventTypes: readonly string[],
  message = EVENT_EMISSION_FAILURE_MESSAGE,
): ApplicationEventNotifier<T> {
  return createFailingApplicationEventNotifier([], failOnEventTypes, message);
}
