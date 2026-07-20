import type { SignalResult } from '../../signal-engine';

/**
 * Published to in-process listeners after every successful scheduled
 * evaluation (US016). Carries the workspace scope that SignalResult itself
 * does not contain.
 */
export type EvaluationResultEvent = Readonly<{
  workspaceId: string;
  strategyId: string;
  result: SignalResult;
}>;

/**
 * In-process subscriber to scheduler evaluation results (US016).
 * Listener failures are logged and swallowed by the scheduler — they must
 * never break scheduling or other listeners.
 */
export type EvaluationResultListener = (event: EvaluationResultEvent) => void | Promise<void>;

export function freezeEvaluationResultEvent(event: EvaluationResultEvent): EvaluationResultEvent {
  return Object.freeze({ ...event });
}
