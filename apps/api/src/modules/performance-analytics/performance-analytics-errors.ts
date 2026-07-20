/**
 * Application errors for US202 Performance Analytics.
 */

export type PerformanceAnalyticsErrorCode =
  'PERFORMANCE_ANALYTICS_VALIDATION' | 'PERFORMANCE_ANALYTICS_DUPLICATE_ANALYSIS';

export abstract class PerformanceAnalyticsError extends Error {
  abstract readonly code: PerformanceAnalyticsErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PerformanceAnalyticsValidationError extends PerformanceAnalyticsError {
  readonly code = 'PERFORMANCE_ANALYTICS_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class PerformanceAnalyticsDuplicateAnalysisError extends PerformanceAnalyticsError {
  readonly code = 'PERFORMANCE_ANALYTICS_DUPLICATE_ANALYSIS' as const;

  constructor(analysisId: string) {
    super(`Performance analysis already completed: ${analysisId}`);
  }
}
