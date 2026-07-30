import { TradingSessionStatus, TERMINAL_SESSION_STATUSES } from './trading-session-status';

/**
 * Non-terminal Session statuses eligible for startup recovery discovery (E17 / US240).
 *
 * Matches Epic E17 US240 AC discovery set. `CREATED` is non-terminal but is not
 * a recovery candidate — start has not begun. Terminal statuses are never eligible.
 *
 * Note: a `COMPLETED` status is not part of ADR-014 / `TradingSessionStatus`;
 * any unknown or terminal status is treated as not eligible.
 */
export const RECOVERY_ELIGIBLE_SESSION_STATUSES: ReadonlySet<TradingSessionStatus> = new Set([
  TradingSessionStatus.STARTING,
  TradingSessionStatus.RUNNING,
  TradingSessionStatus.PAUSED,
  TradingSessionStatus.RECOVERING,
  TradingSessionStatus.STOPPING,
]);

/** Explicit terminal / closed statuses that must never be recovery candidates. */
export const RECOVERY_INELIGIBLE_TERMINAL_STATUSES: ReadonlySet<TradingSessionStatus> = new Set([
  TradingSessionStatus.STOPPED,
  TradingSessionStatus.FAILED,
]);

export function isRecoveryEligibleStatus(status: TradingSessionStatus): boolean {
  if (TERMINAL_SESSION_STATUSES.has(status)) {
    return false;
  }
  if (RECOVERY_INELIGIBLE_TERMINAL_STATUSES.has(status)) {
    return false;
  }
  return RECOVERY_ELIGIBLE_SESSION_STATUSES.has(status);
}

export function recoveryEligibleStatusValues(): TradingSessionStatus[] {
  return [...RECOVERY_ELIGIBLE_SESSION_STATUSES].sort((a, b) => a.localeCompare(b));
}
