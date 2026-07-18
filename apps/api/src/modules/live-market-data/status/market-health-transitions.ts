import { MarketHealthStatus } from '../domain/market-status';

/**
 * Explicit market-health transition graph (US144).
 * Illegal transitions throw — state changes must be intentional.
 */
const ALLOWED: ReadonlyMap<MarketHealthStatus, ReadonlySet<MarketHealthStatus>> = new Map<
  MarketHealthStatus,
  ReadonlySet<MarketHealthStatus>
>([
  [
    MarketHealthStatus.UNKNOWN,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.CONNECTING,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.DISCONNECTED,
    new Set<MarketHealthStatus>([MarketHealthStatus.CONNECTING, MarketHealthStatus.FAILED]),
  ],
  [
    MarketHealthStatus.CONNECTING,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.HEALTHY,
      MarketHealthStatus.RECOVERING,
      MarketHealthStatus.STALE,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.RECOVERING,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.HEALTHY,
      MarketHealthStatus.STALE,
      MarketHealthStatus.UNAVAILABLE,
      MarketHealthStatus.DEGRADED,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.HEALTHY,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.STALE,
      MarketHealthStatus.RECOVERING,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.STALE,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.HEALTHY,
      MarketHealthStatus.RECOVERING,
      MarketHealthStatus.UNAVAILABLE,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.DEGRADED,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.RECOVERING,
      MarketHealthStatus.HEALTHY,
      MarketHealthStatus.UNAVAILABLE,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.UNAVAILABLE,
    new Set<MarketHealthStatus>([
      MarketHealthStatus.RECOVERING,
      MarketHealthStatus.CONNECTING,
      MarketHealthStatus.DISCONNECTED,
      MarketHealthStatus.FAILED,
    ]),
  ],
  [
    MarketHealthStatus.FAILED,
    new Set<MarketHealthStatus>([MarketHealthStatus.CONNECTING, MarketHealthStatus.DISCONNECTED]),
  ],
]);

export function canTransitionMarketHealth(
  from: MarketHealthStatus,
  to: MarketHealthStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED.get(from)?.has(to) ?? false;
}

export function assertMarketHealthTransition(
  from: MarketHealthStatus,
  to: MarketHealthStatus,
): void {
  if (!canTransitionMarketHealth(from, to)) {
    throw new Error(`illegal market health transition: ${from} -> ${to}`);
  }
}
