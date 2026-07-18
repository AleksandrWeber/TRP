import { MarketHealthStatus } from '../domain/market-status';

/**
 * Staleness policy for market-stream health (US144).
 * Uses operational clocks only — never exchange/domain candle timestamps.
 */
export type MarketStalenessPolicy = Readonly<{
  /** Max age of last operational message (received/heartbeat) before STALE. */
  stalenessThresholdMs: number;
}>;

export const DEFAULT_MARKET_STALENESS_POLICY: MarketStalenessPolicy = Object.freeze({
  stalenessThresholdMs: 60_000,
});

/**
 * Operational inputs for health evaluation (US144).
 * Must not include OHLCV/price fields — health cannot rewrite semantics.
 */
export type MarketHealthEvaluationInput = Readonly<{
  connection: 'disconnected' | 'connecting' | 'connected' | 'failed';
  /** True when the stream has no open sequence/time gap. */
  gapFree: boolean;
  /**
   * Last operational inbound activity (ISO-8601).
   * Use receivedAt / connector lastMessageAt — never exchangeOccurredAt alone.
   */
  lastOperationalMessageAt: string | null;
  now: string;
  policy?: Partial<MarketStalenessPolicy>;
  /** When true, unresolved gaps evaluate to UNAVAILABLE rather than RECOVERING. */
  unresolvedGap?: boolean;
}>;

/**
 * Evaluate operational market health (US144 / ADR-018 #49–53).
 * Freshness decisions use operational time only.
 * Result never mutates candle/price payloads.
 */
export function evaluateMarketHealth(input: MarketHealthEvaluationInput): MarketHealthStatus {
  if (input.connection === 'failed') {
    return MarketHealthStatus.FAILED;
  }
  if (input.connection === 'disconnected') {
    return MarketHealthStatus.DISCONNECTED;
  }
  if (input.connection === 'connecting') {
    return MarketHealthStatus.CONNECTING;
  }

  // connected
  if (input.unresolvedGap) {
    return MarketHealthStatus.UNAVAILABLE;
  }
  if (!input.gapFree) {
    return MarketHealthStatus.RECOVERING;
  }

  const threshold =
    input.policy?.stalenessThresholdMs ?? DEFAULT_MARKET_STALENESS_POLICY.stalenessThresholdMs;
  if (!isOperationallyFresh(input.lastOperationalMessageAt, input.now, threshold)) {
    return MarketHealthStatus.STALE;
  }

  return MarketHealthStatus.HEALTHY;
}

/**
 * Healthy requires connected, gap-free, and sufficiently fresh (US144).
 */
export function isMarketStreamHealthy(status: MarketHealthStatus): boolean {
  return status === MarketHealthStatus.HEALTHY;
}

export function isOperationallyFresh(
  lastOperationalMessageAt: string | null,
  now: string,
  stalenessThresholdMs: number,
): boolean {
  if (lastOperationalMessageAt === null) return false;
  const last = Date.parse(lastOperationalMessageAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(last) || !Number.isFinite(nowMs)) return false;
  return nowMs - last <= stalenessThresholdMs;
}
