import { TradingSessionStatus } from './trading-session-status';

/**
 * Allowed ADR-014 transitions (US156).
 * Invalid transitions are rejected by callers and durably recorded.
 */
const ALLOWED: ReadonlyMap<TradingSessionStatus, ReadonlySet<TradingSessionStatus>> = new Map([
  [TradingSessionStatus.CREATED, new Set([TradingSessionStatus.STARTING])],
  [
    TradingSessionStatus.STARTING,
    new Set([TradingSessionStatus.RUNNING, TradingSessionStatus.FAILED]),
  ],
  [
    TradingSessionStatus.RUNNING,
    new Set([
      TradingSessionStatus.PAUSED,
      TradingSessionStatus.STOPPING,
      TradingSessionStatus.RECOVERING,
      TradingSessionStatus.FAILED,
    ]),
  ],
  [
    TradingSessionStatus.PAUSED,
    new Set([
      TradingSessionStatus.RUNNING,
      TradingSessionStatus.STOPPING,
      TradingSessionStatus.RECOVERING,
      TradingSessionStatus.FAILED,
    ]),
  ],
  [
    TradingSessionStatus.RECOVERING,
    new Set([
      TradingSessionStatus.RUNNING,
      TradingSessionStatus.PAUSED,
      TradingSessionStatus.FAILED,
    ]),
  ],
  [TradingSessionStatus.STOPPING, new Set([TradingSessionStatus.STOPPED])],
  [TradingSessionStatus.STOPPED, new Set()],
  [TradingSessionStatus.FAILED, new Set()],
]);

export function canTransition(from: TradingSessionStatus, to: TradingSessionStatus): boolean {
  return ALLOWED.get(from)?.has(to) ?? false;
}

export function assertTransition(from: TradingSessionStatus, to: TradingSessionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid trading session transition: ${from} → ${to}`);
  }
}
