export {
  RegressionSuiteService,
  type CreateDeterministicReplayValidationServiceFn,
  type CreateHistoricalReplayServiceFn,
  type CreateMultiYearResearchServiceFn,
  type CreateRegressionScenarioResultFn,
  type CreateRegressionSuiteResultFn,
  type CreateSmokeBacktestServiceFn,
  type CreateWalkForwardValidationServiceFn,
  type RegressionSuiteServiceDependencies,
} from './regression-suite.service';
export {
  createRegressionSuiteConfiguration,
  type CreateRegressionSuiteConfigurationInput,
  type RegressionSuiteConfiguration,
} from './regression-suite-configuration';
export {
  REGRESSION_SCENARIO_TYPES,
  isRegressionScenarioType,
  type RegressionScenarioType,
} from './regression-scenario-type';
export {
  createRegressionScenario,
  validateExpectedResult,
  type CreateRegressionScenarioInput,
  type RegressionExpectedMetrics,
  type RegressionExpectedResult,
  type RegressionScenario,
  type RegressionStableEvent,
} from './regression-scenario';
export {
  ExecutionBaselineComparator,
  executionBaselineComparator,
  executionOrder,
  stableApplicationEvent,
  stableApplicationEvents,
  type CompareExecutionBaselineInput,
  type ExecutionBaseline,
} from './execution-baseline-comparator';
export { createRegressionMismatch, type RegressionMismatch } from './regression-mismatch';
export {
  createRegressionScenarioResult,
  type RegressionScenarioResult,
} from './regression-scenario-result';
export {
  aggregateRegressionSuiteResult,
  createRegressionSuiteResult,
  type RegressionSuiteResult,
} from './regression-suite-result';
export {
  createRegressionSuiteMetrics,
  type RegressionSuiteMetrics,
} from './regression-suite-metrics';
export type {
  RegressionDetected,
  RegressionSuiteCompleted,
  RegressionSuiteEvent,
  RegressionSuiteEventType,
  RegressionSuiteStarted,
  ScenarioFailed,
  ScenarioPassed,
} from './regression-suite-events';
export { REGRESSION_SUITE_EVENT_TYPES } from './regression-suite-events';
export {
  RegressionSuiteAlreadyCompletedError,
  RegressionSuiteDuplicateExecutionError,
  RegressionSuiteError,
  RegressionSuiteExecutionFailedError,
  RegressionSuiteRegressionDetectedError,
  RegressionSuiteValidationError,
  type RegressionSuiteErrorCode,
} from './regression-suite-errors';
export {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_DATASET_ID,
  REGRESSION_DETERMINISTIC_ITERATIONS,
  REGRESSION_DETERMINISTIC_VALIDATION_ID,
  REGRESSION_SUITE_ID,
  captureRegressionBaseline,
  createBenchmarkHistoricalDataset,
  createDeterministicReplayRegressionDependencies,
  createHistoricalReplayBenchmarkDependencies,
  createMultiYearBenchmarkDependencies,
  createMultiYearResearchConfiguration,
  createPredefinedRegressionSuiteConfiguration,
  createRegressionScenarioFactories,
  createSmokeBenchmarkDependencies,
  createWalkForwardBenchmarkDependencies,
  predefinedRegressionScenarioEntries,
  predefinedRegressionScenarios,
  type CaptureRegressionBaselineFn,
  type RegressionScenarioContext,
  type RegressionScenarioFactories,
} from './regression-scenarios';
