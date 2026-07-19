export { MarketDataDomainModule } from './market-data-domain.module';
export { MarketDataDomainController, DEFAULT_CANDLES_LIMIT } from './market-data-domain.controller';
export type { MarketHealthView } from './market-data-domain.controller';
export { createCandle, assertSymbol } from './domain/candle';
export type { Candle } from './domain/candle';
export { createTicker } from './domain/ticker';
export type { Ticker } from './domain/ticker';
export { Timeframe, isTimeframe, timeframeToMillis } from './domain/timeframe';
export type {
  MarketDataProvider,
  MarketDataProviderHealth,
  MarketDataProviderHealthStatus,
} from './ports/market-data-provider';
export { MARKET_DATA_PROVIDER_HEALTH_STATUSES } from './ports/market-data-provider';
export { MarketDataProviderRegistry } from './ports/market-data-provider-registry';
export { MARKET_DATA_PROVIDER } from './ports/market-data-provider.token';
export {
  MockMarketDataProvider,
  MOCK_MARKET_DATA_PROVIDER_ID,
  MOCK_SERIES_ANCHOR_ISO,
} from './providers/mock-market-data-provider';
export {
  BinanceMarketDataProvider,
  BINANCE_MARKET_DATA_PROVIDER_ID,
  BINANCE_DEFAULT_BASE_URL,
  BINANCE_DEFAULT_TIMEOUT_MS,
} from './providers/binance-market-data-provider';
export type { BinanceMarketDataProviderOptions } from './providers/binance-market-data-provider';
export {
  MarketDataDomainError,
  UnsupportedMarketSymbolError,
  UnsupportedMarketTimeframeError,
  MarketDataProviderUnavailableError,
  MarketDataProviderTimeoutError,
  MARKET_DATA_DOMAIN_ERROR_CODES,
} from './domain/market-data-domain.error';
export type { MarketDataDomainErrorCode } from './domain/market-data-domain.error';
export { MarketDataDomainErrorFilter } from './market-data-domain-error.filter';
export {
  MARKET_DATA_PROVIDER_ENV_VAR,
  DEFAULT_MARKET_DATA_PROVIDER_ID,
  resolveMarketDataProviderId,
} from './market-data-provider.config';
