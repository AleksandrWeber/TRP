export {
  PerformanceBenchmarkService,
  createDefaultBenchmarkExecutionId,
  type CreateBenchmarkResultFn,
  type CreateBenchmarkSuiteResultFn,
  type CreateHistoricalReplayServiceFn,
  type CreateMultiYearResearchServiceFn,
  type CreateSmokeBacktestServiceFn,
  type CreateWalkForwardValidationServiceFn,
  type PerformanceBenchmarkServiceDependencies,
} from './performance-benchmark.service';
export {
  createBenchmarkSuiteConfiguration,
  type BenchmarkEntryConfiguration,
  type BenchmarkSuiteConfiguration,
  type CreateBenchmarkSuiteConfigurationInput,
} from './benchmark-configuration';
export {
  BENCHMARK_SCENARIOS,
  isBenchmarkScenario,
  type BenchmarkScenario,
} from './benchmark-scenario';
export {
  calculateThroughput,
  createBenchmarkResult,
  type BenchmarkResult,
} from './benchmark-result';
export {
  aggregateBenchmarkSuiteResult,
  createBenchmarkSuiteResult,
  type BenchmarkSuiteResult,
} from './benchmark-suite-result';
export {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  createBenchmarkHistoricalDataset,
  createBenchmarkScenarioFactories,
  createHistoricalReplayBenchmarkDependencies,
  createMultiYearBenchmarkDependencies,
  createPredefinedBenchmarkSuiteConfiguration,
  createSmokeBenchmarkDependencies,
  createWalkForwardBenchmarkDependencies,
  predefinedBenchmarkSuiteEntries,
  type BenchmarkScenarioContext,
  type BenchmarkScenarioFactories,
} from './benchmark-scenarios';
export type {
  BenchmarkCompleted,
  BenchmarkFailed,
  BenchmarkStarted,
  PerformanceBenchmarkEvent,
  PerformanceBenchmarkEventType,
  SuiteCompleted,
} from './benchmark-events';
export { PERFORMANCE_BENCHMARK_EVENT_TYPES } from './benchmark-events';
export {
  PerformanceBenchmarkAlreadyCompletedError,
  PerformanceBenchmarkDuplicateExecutionError,
  PerformanceBenchmarkError,
  PerformanceBenchmarkExecutionFailedError,
  PerformanceBenchmarkValidationError,
  type PerformanceBenchmarkErrorCode,
} from './benchmark-errors';
