import type { SignalType } from '../../signal-engine';

/**
 * Minimum allowed evaluation interval (1s). Prevents busy-loop schedules.
 */
export const MIN_EVALUATION_INTERVAL_MS = 1_000;

/**
 * Maximum allowed evaluation interval (24h). Rejects accidental unbounded waits.
 */
export const MAX_EVALUATION_INTERVAL_MS = 86_400_000;

/**
 * In-memory evaluation schedule (US015).
 * One schedule per workspace-scoped strategy. Not persisted.
 */
export type EvaluationSchedule = Readonly<{
  workspaceId: string;
  strategyId: string;
  /** Positive integer milliseconds between Signal Engine invocations. */
  intervalMs: number;
  /** ISO-8601 moment the schedule was registered. */
  createdAt: string;
  /** ISO-8601 moment of the last completed evaluation, or null. */
  lastEvaluatedAt: string | null;
  /** Last SignalResult.signal observed by the scheduler, or null. */
  lastSignal: SignalType | null;
}>;

export function scheduleKey(workspaceId: string, strategyId: string): string {
  return `${workspaceId}::${strategyId}`;
}

export function freezeSchedule(schedule: EvaluationSchedule): EvaluationSchedule {
  return Object.freeze({ ...schedule });
}
