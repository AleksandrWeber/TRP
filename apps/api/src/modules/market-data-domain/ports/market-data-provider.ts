import type { Candle } from '../domain/candle';
import type { Ticker } from '../domain/ticker';
import type { Timeframe } from '../domain/timeframe';

export const MARKET_DATA_PROVIDER_HEALTH_STATUSES = ['ok', 'degraded', 'down'] as const;
export type MarketDataProviderHealthStatus = (typeof MARKET_DATA_PROVIDER_HEALTH_STATUSES)[number];

export type MarketDataProviderHealth = Readonly<{
  providerId: string;
  status: MarketDataProviderHealthStatus;
  /** Human-readable detail — never provider-internal payloads. */
  detail: string;
}>;

/**
 * Provider-agnostic live market data port (US006).
 * The application depends only on this interface; Binance / Bybit / OKX
 * implementations plug in behind it without touching any consumer.
 *
 * Distinct from the historical research `MarketDataProvider` (US117) in
 * `modules/market-data-provider` — this port serves current market reads.
 */
export interface MarketDataProvider {
  /** Stable registry identifier, e.g. 'mock', 'binance'. */
  readonly id: string;

  getTicker(symbol: string): Promise<Ticker>;

  getCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<Candle[]>;

  health(): Promise<MarketDataProviderHealth>;
}
