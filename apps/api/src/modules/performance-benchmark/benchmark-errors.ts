/**
 * Application errors for US196 Performance Benchmark.
 */

export type PerformanceBenchmarkErrorCode =
  | 'PERFORMANCE_BENCHMARK_VALIDATION'
  | 'PERFORMANCE_BENCHMARK_ALREADY_COMPLETED'
  | 'PERFORMANCE_BENCHMARK_DUPLICATE_EXECUTION'
  | 'PERFORMANCE_BENCHMARK_EXECUTION_FAILED';

export abstract class PerformanceBenchmarkError extends Error {
  abstract readonly code: PerformanceBenchmarkErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PerformanceBenchmarkValidationError extends PerformanceBenchmarkError {
  readonly code = 'PERFORMANCE_BENCHMARK_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class PerformanceBenchmarkAlreadyCompletedError extends PerformanceBenchmarkError {
  readonly code = 'PERFORMANCE_BENCHMARK_ALREADY_COMPLETED' as const;

  constructor(suiteId: string) {
    super(`Performance benchmark suite already completed for suite: ${suiteId}`);
  }
}

export class PerformanceBenchmarkDuplicateExecutionError extends PerformanceBenchmarkError {
  readonly code = 'PERFORMANCE_BENCHMARK_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Performance benchmark execution is already in progress');
  }
}

export class PerformanceBenchmarkExecutionFailedError extends PerformanceBenchmarkError {
  readonly code = 'PERFORMANCE_BENCHMARK_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
