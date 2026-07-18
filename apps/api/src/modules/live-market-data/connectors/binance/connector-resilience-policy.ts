/**
 * Shared reconnect / rate-limit backoff policy (US134).
 * Delays are bounded; jitter avoids reconnect storms.
 */
export type ConnectorResiliencePolicy = Readonly<{
  /** Max reconnect attempts after unexpected disconnect (0 = disabled). */
  maxReconnectAttempts: number;
  /** Base delay for reconnect exponential backoff (ms). */
  reconnectBaseDelayMs: number;
  /** Cap for reconnect backoff (ms). */
  reconnectMaxDelayMs: number;
  /** Jitter ratio 0..1 applied to reconnect delay. */
  reconnectJitterRatio: number;
  /** Max REST rate-limit retries after the first failure. */
  maxRateLimitRetries: number;
  /** Minimum wait on rate-limit even when Retry-After is 0 (no busy-loop). */
  rateLimitMinDelayMs: number;
  /** Base delay when Retry-After is absent. */
  rateLimitBaseDelayMs: number;
  /** Inactivity timeout before heartbeat failure (ms). */
  heartbeatTimeoutMs: number;
}>;

export const DEFAULT_CONNECTOR_RESILIENCE_POLICY: ConnectorResiliencePolicy = Object.freeze({
  maxReconnectAttempts: 5,
  reconnectBaseDelayMs: 250,
  reconnectMaxDelayMs: 30_000,
  reconnectJitterRatio: 0.2,
  maxRateLimitRetries: 3,
  rateLimitMinDelayMs: 100,
  rateLimitBaseDelayMs: 250,
  heartbeatTimeoutMs: 30_000,
});

/**
 * Exponential backoff with optional jitter.
 * `attempt` is 1-based.
 */
export function computeReconnectDelayMs(
  policy: ConnectorResiliencePolicy,
  attempt: number,
  random: () => number = Math.random,
): number {
  const n = Math.max(1, attempt);
  const exp = Math.min(policy.reconnectMaxDelayMs, policy.reconnectBaseDelayMs * 2 ** (n - 1));
  const jitter = exp * policy.reconnectJitterRatio * random();
  return Math.min(policy.reconnectMaxDelayMs, Math.floor(exp + jitter));
}

/**
 * Rate-limit wait: honors Retry-After when present, otherwise exponential base,
 * always at least `rateLimitMinDelayMs` (never busy-loops).
 */
export function computeRateLimitDelayMs(
  policy: ConnectorResiliencePolicy,
  attempt: number,
  retryAfterHeader: string | null,
): number {
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.max(policy.rateLimitMinDelayMs, Math.floor(retryAfterSeconds * 1000));
  }
  const n = Math.max(1, attempt);
  const exp = policy.rateLimitBaseDelayMs * n;
  return Math.max(policy.rateLimitMinDelayMs, exp);
}
