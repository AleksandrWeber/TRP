/**
 * Configurable retry policy for the Queue abstraction (US110).
 * Delay for attempt n (0-based after first failure): baseDelayMs * 2^n
 */
export type RetryPolicy = {
  /** Maximum number of retries after the first failure. 0 = fail once → DLQ. */
  maxRetries: number;
  /** Base delay in ms for exponential backoff. */
  baseDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 0,
  baseDelayMs: 1000,
};

export function resolveRetryPolicy(get?: (key: string) => string | undefined): RetryPolicy {
  const maxRaw = get?.('QUEUE_MAX_RETRIES') ?? process.env.QUEUE_MAX_RETRIES;
  const baseRaw = get?.('QUEUE_BACKOFF_BASE_MS') ?? process.env.QUEUE_BACKOFF_BASE_MS;

  const maxRetries = maxRaw !== undefined ? Number(maxRaw) : DEFAULT_RETRY_POLICY.maxRetries;
  const baseDelayMs = baseRaw !== undefined ? Number(baseRaw) : DEFAULT_RETRY_POLICY.baseDelayMs;

  return {
    maxRetries:
      Number.isFinite(maxRetries) && maxRetries >= 0 ? maxRetries : DEFAULT_RETRY_POLICY.maxRetries,
    baseDelayMs:
      Number.isFinite(baseDelayMs) && baseDelayMs >= 0
        ? baseDelayMs
        : DEFAULT_RETRY_POLICY.baseDelayMs,
  };
}

/** Exponential backoff delay after `attempt` failed tries (attempt is 1-based failure count). */
export function computeBackoffDelayMs(policy: RetryPolicy, attempt: number): number {
  const n = Math.max(0, attempt - 1);
  return policy.baseDelayMs * 2 ** n;
}
