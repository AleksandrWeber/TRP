/**
 * ADR-014 Trading Session states (US156).
 */
export enum TradingSessionStatus {
  CREATED = 'created',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  RECOVERING = 'recovering',
  FAILED = 'failed',
}

export const TERMINAL_SESSION_STATUSES: ReadonlySet<TradingSessionStatus> = new Set([
  TradingSessionStatus.STOPPED,
  TradingSessionStatus.FAILED,
]);

/** States that MUST NOT create new execution (ADR-014 / ADR-018 #24). */
export const NON_EXECUTABLE_SESSION_STATUSES: ReadonlySet<TradingSessionStatus> = new Set([
  TradingSessionStatus.CREATED,
  TradingSessionStatus.STARTING,
  TradingSessionStatus.PAUSED,
  TradingSessionStatus.STOPPING,
  TradingSessionStatus.STOPPED,
  TradingSessionStatus.RECOVERING,
  TradingSessionStatus.FAILED,
]);

export function isTradingSessionStatus(value: string): value is TradingSessionStatus {
  return Object.values(TradingSessionStatus).includes(value as TradingSessionStatus);
}
