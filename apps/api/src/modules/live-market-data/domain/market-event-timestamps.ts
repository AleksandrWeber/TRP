/**
 * Timestamp semantics for live market events (US127 / ADR-018 #51).
 *
 * Exchange/domain times are business inputs.
 * Received / processed / recorded are operational only and MUST NOT
 * change semantic identity or normalized business payloads.
 */
export type MarketEventTimestamps = Readonly<{
  /** Exchange-reported event time (ISO-8601). */
  exchangeOccurredAt: string;
  /** Canonical domain time after normalization (ISO-8601). */
  occurredAt: string;
  /** Connector receive wall-clock (operational). */
  receivedAt: string;
  /** Normalization/processing wall-clock (operational). */
  processedAt: string;
  /** Persistence/outbox wall-clock (operational). */
  recordedAt: string;
}>;

export type MarketEventTimestampInput = {
  exchangeOccurredAt: string;
  occurredAt?: string;
  receivedAt: string;
  processedAt: string;
  recordedAt: string;
};
