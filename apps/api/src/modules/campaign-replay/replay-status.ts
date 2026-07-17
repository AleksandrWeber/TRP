/**
 * Replay lifecycle status (US066–US067).
 *
 * READY → RUNNING → COMPLETED
 * FAILED on execution error.
 */
export enum ReplayStatus {
  READY = 'READY',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
