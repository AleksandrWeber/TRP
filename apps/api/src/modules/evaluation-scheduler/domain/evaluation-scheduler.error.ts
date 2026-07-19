import { MAX_EVALUATION_INTERVAL_MS, MIN_EVALUATION_INTERVAL_MS } from './evaluation-schedule';

export const EVALUATION_SCHEDULER_ERROR_CODES = [
  'INVALID_SCHEDULE',
  'INVALID_INTERVAL',
  'DUPLICATE_SCHEDULE',
  'SCHEDULE_NOT_FOUND',
  'STRATEGY_NOT_FOUND',
] as const;

export type EvaluationSchedulerErrorCode = (typeof EVALUATION_SCHEDULER_ERROR_CODES)[number];

/**
 * Canonical error boundary of the Evaluation Scheduler (US015).
 */
export abstract class EvaluationSchedulerError extends Error {
  abstract readonly code: EvaluationSchedulerErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** workspaceId / strategyId missing or blank when registering a schedule. */
export class InvalidScheduleError extends EvaluationSchedulerError {
  readonly code = 'INVALID_SCHEDULE' as const;

  constructor(message: string) {
    super(message);
  }
}

/** intervalMs is missing, non-integer, non-positive, or outside allowed bounds. */
export class InvalidScheduleIntervalError extends EvaluationSchedulerError {
  readonly code = 'INVALID_INTERVAL' as const;

  constructor(intervalMs: unknown) {
    super(
      `Invalid evaluation interval '${String(intervalMs)}' — expected an integer between ${MIN_EVALUATION_INTERVAL_MS} and ${MAX_EVALUATION_INTERVAL_MS} ms`,
    );
  }
}

/** A schedule already exists for the workspace-scoped strategy. */
export class DuplicateScheduleError extends EvaluationSchedulerError {
  readonly code = 'DUPLICATE_SCHEDULE' as const;

  constructor(workspaceId: string, strategyId: string) {
    super(
      `Evaluation schedule already exists for strategy '${strategyId}' in workspace '${workspaceId}'`,
    );
  }
}

/** No schedule is registered for the workspace-scoped strategy. */
export class ScheduleNotFoundError extends EvaluationSchedulerError {
  readonly code = 'SCHEDULE_NOT_FOUND' as const;

  constructor(workspaceId: string, strategyId: string) {
    super(
      `Evaluation schedule not found for strategy '${strategyId}' in workspace '${workspaceId}'`,
    );
  }
}

/** Strategy does not exist in the workspace when registering a schedule. */
export class ScheduleStrategyNotFoundError extends EvaluationSchedulerError {
  readonly code = 'STRATEGY_NOT_FOUND' as const;

  constructor(workspaceId: string, strategyId: string) {
    super(`Strategy '${strategyId}' not found in workspace '${workspaceId}'`);
  }
}
