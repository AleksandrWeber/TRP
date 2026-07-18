/**
 * Outbox dispatcher retry policy (US130).
 * Exhausted attempts move the Outbox row to dead_letter.
 */
export type OutboxRetryPolicy = {
  /** Maximum delivery attempts before dead-letter. */
  maxAttempts: number;
  /** Base delay in ms for exponential backoff after failure. */
  baseDelayMs: number;
};

export const DEFAULT_OUTBOX_RETRY_POLICY: OutboxRetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1000,
};

/** Delay after `attempt` failed tries (attempt is 1-based failure count). */
export function computeOutboxBackoffDelayMs(policy: OutboxRetryPolicy, attempt: number): number {
  const n = Math.max(0, attempt - 1);
  return policy.baseDelayMs * 2 ** n;
}
