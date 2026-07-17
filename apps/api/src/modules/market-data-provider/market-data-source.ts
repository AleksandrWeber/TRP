/**
 * Known historical market data sources (US117).
 * String enum so future providers can register without Domain changes.
 */
export enum MarketDataSource {
  Local = 'local',
  Binance = 'binance',
  Bybit = 'bybit',
  Polygon = 'polygon',
  YahooFinance = 'yahoo-finance',
  Alpaca = 'alpaca',
}
