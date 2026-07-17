/**
 * Outcome payload for a finished Job (US069).
 * Execution / queue wiring is deferred — shape only.
 */
export type JobResult = {
  success: boolean;
  message?: string;
  error?: string;
};
