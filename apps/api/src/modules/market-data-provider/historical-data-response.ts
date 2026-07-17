import type { MarketBar } from '../market-data/market-bar';
import type { MarketDataSource } from './market-data-source';

/**
 * Response from a MarketDataProvider historical fetch (US117).
 */
export type HistoricalDataResponse = {
  bars: MarketBar[];
  source: MarketDataSource | string;
  /** ISO-8601 timestamp when the provider returned this payload. */
  fetchedAt: string;
};
