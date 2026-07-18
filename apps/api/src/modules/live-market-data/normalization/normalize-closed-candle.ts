import { createClosedCandleEvent, type ClosedCandleEvent } from '../domain/closed-candle-event';
import { buildMarketEventSemanticIdentity } from '../domain/market-event-identity';
import type { ClosedCandleDraft } from './closed-candle-draft';

export type ClosedCandleNormalizationSuccess = Readonly<{
  ok: true;
  event: ClosedCandleEvent;
}>;

export type ClosedCandleNormalizationFailure = Readonly<{
  ok: false;
  reason: string;
}>;

export type ClosedCandleNormalizationResult =
  ClosedCandleNormalizationSuccess | ClosedCandleNormalizationFailure;

/**
 * Normalize a provider-neutral closed-candle draft into a canonical MarketClosedCandle (US135).
 * Open/incomplete candles are rejected. Provider-specific fields are never accepted.
 */
export function normalizeClosedCandle(draft: ClosedCandleDraft): ClosedCandleNormalizationResult {
  if (!draft.isClosed) {
    return { ok: false, reason: 'open or incomplete candle is not publishable as closed' };
  }

  try {
    assertNoProviderLeak(draft as unknown as Record<string, unknown>);
    const event = createClosedCandleEvent({
      workspaceId: draft.workspaceId,
      sourceId: draft.sourceId,
      instrument: draft.instrument,
      timeframe: draft.timeframe,
      sequence: draft.sequence,
      openTime: draft.openTime,
      closeTime: draft.closeTime,
      open: draft.open,
      high: draft.high,
      low: draft.low,
      close: draft.close,
      volume: draft.volume,
      exchangeOccurredAt: draft.exchangeOccurredAt,
      occurredAt: draft.exchangeOccurredAt,
      receivedAt: draft.receivedAt,
      processedAt: draft.processedAt,
      recordedAt: draft.recordedAt,
    });

    return { ok: true, event };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Semantic equality for closed candles ignores operational clocks (US135 / ADR-018 #50).
 */
export function closedCandlesAreSemanticallyEqual(
  a: ClosedCandleEvent,
  b: ClosedCandleEvent,
): boolean {
  return buildMarketEventSemanticIdentity(a) === buildMarketEventSemanticIdentity(b);
}

const FORBIDDEN_PROVIDER_KEYS = new Set([
  'e',
  'E',
  's',
  'k',
  'x',
  't',
  'T',
  'o',
  'h',
  'l',
  'c',
  'v',
  'filterType',
  'tickSize',
  'stepSize',
  'raw',
  'binance',
  'payload',
]);

function assertNoProviderLeak(draft: Record<string, unknown>): void {
  for (const key of Object.keys(draft)) {
    if (FORBIDDEN_PROVIDER_KEYS.has(key)) {
      throw new Error(`provider-specific field must not enter normalization: ${key}`);
    }
  }
}
