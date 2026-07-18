/**
 * Configurable mark-price retention / publication policy (US136).
 * High-volume mark streams may be throttled without changing business semantics.
 */
export type MarkPricePublicationPolicy = Readonly<{
  /** Publish at most one event per instrument per this window (ms). 0 = no throttle. */
  minPublishIntervalMs: number;
  /** Soft retention hint for durable archives (ms). Operational only. */
  retentionMs: number;
}>;

export const DEFAULT_MARK_PRICE_PUBLICATION_POLICY: MarkPricePublicationPolicy = Object.freeze({
  minPublishIntervalMs: 0,
  retentionMs: 24 * 60 * 60 * 1000,
});

export function resolveMarkPricePublicationPolicy(
  overrides?: Partial<MarkPricePublicationPolicy>,
): MarkPricePublicationPolicy {
  return Object.freeze({
    ...DEFAULT_MARK_PRICE_PUBLICATION_POLICY,
    ...overrides,
  });
}

/**
 * Decide whether a mark-price event should be published under the policy (US136).
 * Does not mutate prices or business identity.
 */
export function shouldPublishMarkPrice(options: {
  policy: MarkPricePublicationPolicy;
  lastPublishedAt: string | null;
  candidateOccurredAt: string;
}): boolean {
  if (options.policy.minPublishIntervalMs <= 0) return true;
  if (options.lastPublishedAt === null) return true;
  const last = Date.parse(options.lastPublishedAt);
  const next = Date.parse(options.candidateOccurredAt);
  if (!Number.isFinite(last) || !Number.isFinite(next)) return false;
  return next - last >= options.policy.minPublishIntervalMs;
}
