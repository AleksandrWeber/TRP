import type { ClosedCandleBackfillBar } from '../ports/live-market-connector';
import type { ClosedCandleDraft } from '../normalization/closed-candle-draft';
import type { MarketDataSourceId } from '../domain/market-data-source';

/**
 * Map a provider-neutral backfill bar into a closed-candle draft (US139).
 * Uses the same normalization path as live WS drafts.
 */
export function mapBackfillBarToClosedCandleDraft(input: {
  bar: ClosedCandleBackfillBar;
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  sequence: number;
  receivedAt: string;
  processedAt: string;
  recordedAt: string;
}): ClosedCandleDraft {
  const { bar } = input;
  return Object.freeze({
    workspaceId: input.workspaceId,
    sourceId: input.sourceId,
    instrument: bar.instrument,
    timeframe: bar.timeframe,
    openTime: bar.openTime,
    closeTime: bar.closeTime,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    exchangeOccurredAt: bar.exchangeOccurredAt,
    receivedAt: input.receivedAt,
    processedAt: input.processedAt,
    recordedAt: input.recordedAt,
    sequence: input.sequence,
    isClosed: true,
  });
}
