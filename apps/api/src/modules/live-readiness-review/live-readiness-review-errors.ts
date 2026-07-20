/**
 * Application errors for US200 Live Readiness Review.
 */

export type LiveReadinessReviewErrorCode =
  | 'LIVE_READINESS_REVIEW_VALIDATION'
  | 'LIVE_READINESS_REVIEW_ALREADY_COMPLETED'
  | 'LIVE_READINESS_REVIEW_DUPLICATE_EXECUTION'
  | 'LIVE_READINESS_REVIEW_EXECUTION_FAILED';

export abstract class LiveReadinessReviewError extends Error {
  abstract readonly code: LiveReadinessReviewErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class LiveReadinessReviewValidationError extends LiveReadinessReviewError {
  readonly code = 'LIVE_READINESS_REVIEW_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class LiveReadinessReviewAlreadyCompletedError extends LiveReadinessReviewError {
  readonly code = 'LIVE_READINESS_REVIEW_ALREADY_COMPLETED' as const;

  constructor(reviewId: string) {
    super(`Live readiness review already completed for review: ${reviewId}`);
  }
}

export class LiveReadinessReviewDuplicateExecutionError extends LiveReadinessReviewError {
  readonly code = 'LIVE_READINESS_REVIEW_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Live readiness review execution is already in progress');
  }
}

export class LiveReadinessReviewExecutionFailedError extends LiveReadinessReviewError {
  readonly code = 'LIVE_READINESS_REVIEW_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
