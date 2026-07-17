import type { HistoricalDataRequest } from './historical-data-request';
import type { HistoricalDataResponse } from './historical-data-response';

/**
 * Pluggable historical market data source (US117).
 * Domain stays unchanged when adding Binance / Bybit / Polygon / Yahoo / Alpaca.
 * No live market data — historical only.
 */
export interface MarketDataProvider {
  supports(source: string): boolean;
  fetchHistorical(request: HistoricalDataRequest): Promise<HistoricalDataResponse>;
}
