/**
 * Application errors for US203 Strategy Optimization.
 */

export type StrategyOptimizationErrorCode =
  | 'STRATEGY_OPTIMIZATION_VALIDATION'
  | 'STRATEGY_OPTIMIZATION_ALREADY_COMPLETED'
  | 'STRATEGY_OPTIMIZATION_DUPLICATE_EXECUTION'
  | 'STRATEGY_OPTIMIZATION_EXECUTION_FAILED'
  | 'STRATEGY_OPTIMIZATION_CONFIGURATION_FAILED';

export abstract class StrategyOptimizationError extends Error {
  abstract readonly code: StrategyOptimizationErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class StrategyOptimizationValidationError extends StrategyOptimizationError {
  readonly code = 'STRATEGY_OPTIMIZATION_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class StrategyOptimizationAlreadyCompletedError extends StrategyOptimizationError {
  readonly code = 'STRATEGY_OPTIMIZATION_ALREADY_COMPLETED' as const;

  constructor(optimizationId: string) {
    super(`Strategy optimization already completed for optimization: ${optimizationId}`);
  }
}

export class StrategyOptimizationDuplicateExecutionError extends StrategyOptimizationError {
  readonly code = 'STRATEGY_OPTIMIZATION_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Strategy optimization execution is already in progress');
  }
}

export class StrategyOptimizationConfigurationFailedError extends StrategyOptimizationError {
  readonly code = 'STRATEGY_OPTIMIZATION_CONFIGURATION_FAILED' as const;
  readonly cause: unknown | undefined;
  readonly configurationId: string;

  constructor(configurationId: string, cause?: unknown) {
    super(`Strategy optimization failed for configuration: ${configurationId}`);
    this.configurationId = configurationId;
    this.cause = cause;
  }
}

export class StrategyOptimizationExecutionFailedError extends StrategyOptimizationError {
  readonly code = 'STRATEGY_OPTIMIZATION_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
