/**
 * Execution status of a PaperTradingRunner instance.
 *
 * RunnerStatus belongs exclusively to the Runner. The TradingSession
 * lifecycle (SessionState) remains a separate, unchanged state machine.
 */
export enum RunnerStatus {
  CREATED = 'CREATED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
}

export function isRunnerStatus(value: unknown): value is RunnerStatus {
  return Object.values(RunnerStatus).includes(value as RunnerStatus);
}
