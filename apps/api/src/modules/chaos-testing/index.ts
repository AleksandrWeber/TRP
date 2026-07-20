export {
  ChaosTestingService,
  type ChaosTestingServiceDependencies,
  type CreateChaosTestResultFn,
  type CreateChaosTestingSuiteResultFn,
  type FailureInjectionResult,
} from './chaos-testing.service';
export {
  createChaosTestingConfiguration,
  type ChaosTestingConfiguration,
  type CreateChaosTestingConfigurationInput,
} from './chaos-testing-configuration';
export {
  CHAOS_SCENARIO_TYPES,
  isChaosScenarioType,
  type ChaosScenarioType,
} from './chaos-scenario-type';
export {
  INJECTED_FAILURE_TYPES,
  isInjectedFailureType,
  type InjectedFailureType,
} from './injected-failure-type';
export {
  createChaosScenario,
  type ChaosScenario,
  type CreateChaosScenarioInput,
} from './chaos-scenario';
export {
  aggregateChaosTestingSuiteResult,
  createChaosTestResult,
  createChaosTestingSuiteResult,
  type ChaosTestResult,
  type ChaosTestingSuiteResult,
  type CreateChaosTestResultInput,
} from './chaos-test-result';
export { createChaosTestingMetrics, type ChaosTestingMetrics } from './chaos-testing-metrics';
export type {
  ChaosScenarioCompleted,
  ChaosScenarioStarted,
  ChaosTestingCompleted,
  ChaosTestingEvent,
  ChaosTestingEventType,
  ChaosTestingStarted,
  FailureInjected,
  RecoveryVerified,
} from './chaos-testing-events';
export { CHAOS_TESTING_EVENT_TYPES } from './chaos-testing-events';
export {
  ChaosTestingAlreadyCompletedError,
  ChaosTestingDuplicateExecutionError,
  ChaosTestingError,
  ChaosTestingExecutionFailedError,
  ChaosTestingScenarioFailedError,
  ChaosTestingValidationError,
  type ChaosTestingErrorCode,
} from './chaos-testing-errors';
export {
  FailureInjector,
  extractErrorCode,
  failureInjector,
  verifyCompletedExecutionPreserved,
  verifyEventEmissionInfrastructureFailure,
  verifyExecutionCleanup,
  verifyExecutionEvents,
  type ChaosScenarioContext,
  type ChaosServiceFactories,
  type ExecutableChaosService,
  type FailureInjectionResult as FailureInjectorResult,
} from './failure-injector';
export {
  FailingMarketDataProvider,
  type FailingMarketDataProviderOptions,
} from './failing-market-data-provider';
export { FailingPaperStrategy, type FailingPaperStrategyOptions } from './failing-paper-strategy';
export {
  FailingResearchOrchestrator,
  type FailingResearchOrchestratorOptions,
} from './failing-research-orchestrator';
export {
  createEventEmissionFailingNotifier,
  DETERMINISTIC_COMPLETION_EVENTS,
  EVENT_EMISSION_FAILURE_MESSAGE,
  HISTORICAL_REPLAY_COMPLETION_EVENTS,
  MULTI_YEAR_COMPLETION_EVENTS,
  SMOKE_COMPLETION_EVENT,
  WALK_FORWARD_COMPLETION_EVENTS,
} from './event-emission-failure-overrides';
export {
  FailingSessionRepository,
  type FailingSessionRepositoryOptions,
} from './failing-session-repository';
export {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  CHAOS_TESTING_SUITE_ID,
  REGRESSION_DETERMINISTIC_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_DATASET_ID,
  REGRESSION_DETERMINISTIC_ITERATIONS,
  REGRESSION_DETERMINISTIC_VALIDATION_ID,
  createChaosScenarioFactories,
  createDeterministicReplayConfiguration,
  createMultiYearResearchConfiguration,
  createPredefinedChaosTestingConfiguration,
  createRecoveryScenarioContext,
  createReplayConfiguration,
  predefinedChaosScenarios,
} from './chaos-scenarios';
