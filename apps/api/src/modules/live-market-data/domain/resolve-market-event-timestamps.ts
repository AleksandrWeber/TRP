import { assertIso8601 } from './assert';
import type { MarketEventTimestampInput, MarketEventTimestamps } from './market-event-timestamps';

/**
 * Normalize timestamp inputs (US127).
 * Domain `occurredAt` defaults to exchange time; operational clocks are required
 * and never folded into business payload equality.
 */
export function resolveMarketEventTimestamps(
  input: MarketEventTimestampInput,
): MarketEventTimestamps {
  const exchangeOccurredAt = assertIso8601(input.exchangeOccurredAt, 'exchangeOccurredAt');
  const occurredAt = assertIso8601(input.occurredAt ?? input.exchangeOccurredAt, 'occurredAt');
  const receivedAt = assertIso8601(input.receivedAt, 'receivedAt');
  const processedAt = assertIso8601(input.processedAt, 'processedAt');
  const recordedAt = assertIso8601(input.recordedAt, 'recordedAt');

  return Object.freeze({
    exchangeOccurredAt,
    occurredAt,
    receivedAt,
    processedAt,
    recordedAt,
  });
}
