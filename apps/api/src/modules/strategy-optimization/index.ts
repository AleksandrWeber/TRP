export {
  StrategyOptimizationService,
  type StrategyOptimizationClock,
} from './strategy-optimization.service';

export {
  createStrategyConfiguration,
  type StrategyConfiguration,
  type CreateStrategyConfigurationInput,
  type StrategyParameters,
} from './strategy-configuration';

export {
  createOptimizationCriteria,
  type OptimizationCriteria,
  type OptimizationCriteriaType,
  type CustomScoreWeights,
  OPTIMIZATION_CRITERIA_TYPES,
  type CreateOptimizationCriteriaInput,
} from './optimization-criteria';

export {
  createExecutionConfiguration,
  type ExecutionConfiguration,
  type CreateExecutionConfigurationInput,
} from './execution-configuration';

export {
  createStrategyOptimizationRequest,
  type StrategyOptimizationRequest,
} from './strategy-optimization-request';

export { createOptimizationResult, type OptimizationResult } from './optimization-result';

export {
  createOptimizationReport,
  deterministicOptimizationReportId,
  type OptimizationReport,
} from './optimization-report';

export {
  createOptimizationDiagnostics,
  type OptimizationDiagnostics,
} from './optimization-diagnostics';

export {
  StrategyOptimizationDuplicateExecutionError,
  StrategyOptimizationAlreadyCompletedError,
  StrategyOptimizationConfigurationFailedError,
  StrategyOptimizationExecutionFailedError,
  StrategyOptimizationValidationError,
} from './strategy-optimization-errors';

export type {
  StrategyOptimizationEvent,
  StrategyOptimizationEventType,
} from './strategy-optimization-events';
