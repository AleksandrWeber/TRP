export {
  InMemorySmokeSessionRepository,
  SmokeBacktestService,
  type SmokeBacktestServiceDependencies,
  type SmokeResearchOrchestrator,
} from './smoke-backtest.service';
export {
  createExecutionMetrics,
  createExecutionResult,
  ExecutionStatus,
  isExecutionStatus,
  metricsFromResult,
  type ExecutionMetrics,
  type ExecutionResult,
} from './execution-result';
export type {
  SmokeBacktestCompleted,
  SmokeBacktestEvent,
  SmokeBacktestFailed,
  SmokeBacktestStarted,
} from './smoke-backtest-events';
export {
  SmokeBacktestActiveRecoveryError,
  SmokeBacktestAlreadyCompletedError,
  SmokeBacktestDuplicateExecutionError,
  SmokeBacktestError,
  SmokeBacktestExecutionFailedError,
  SmokeBacktestExpiredHeartbeatError,
  SmokeBacktestExpiredLeaseError,
  SmokeBacktestRunnerStartupError,
  SmokeBacktestValidationError,
  type SmokeBacktestErrorCode,
} from './smoke-backtest-errors';
export { StubMarketDataProvider, type SmokeCandle } from './stub-market-data-provider';
export { StubPaperStrategy, type StubPaperStrategyDependencies } from './stub-paper-strategy';
