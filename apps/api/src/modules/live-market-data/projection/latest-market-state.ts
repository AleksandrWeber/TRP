import type { ClosedCandleEvent } from '../domain/closed-candle-event';
import type { MarkPriceEvent } from '../domain/mark-price-event';
import type { DurableMarketCheckpoint } from '../checkpoints/market-checkpoint-persistence';

/**
 * Reconstructable latest-market-state read model (US143).
 * No strategy, Position, Portfolio, or Risk calculations.
 */
export type LatestMarketState = Readonly<{
  workspaceId: string;
  streamId: string;
  sourceId: string;
  instrument: string;
  channel: string;
  timeframe?: string;
  latestClosedCandle: ClosedCandleEvent | null;
  latestMarkPrice: MarkPriceEvent | null;
  checkpoint: DurableMarketCheckpoint | null;
  /** Explicit projection freshness (ISO-8601 of last applied event/update). */
  freshnessAt: string | null;
  /** Monotonic projection version — increments on each successful apply. */
  projectionVersion: number;
  updatedAt: string;
}>;

export const LATEST_MARKET_STATE_CONSUMER_ID = 'live-market-data.latest-state';
export const LATEST_MARKET_STATE_CONSUMER_VERSION = '1';
