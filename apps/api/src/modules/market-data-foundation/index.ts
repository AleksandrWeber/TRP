export {
  MARKET_DATA_PROVIDER_CAPABILITIES,
  hasMarketDataProviderCapability,
  isMarketDataProviderCapability,
  type MarketDataProviderCapability,
} from './market-data-provider-capabilities';
export {
  MARKET_DATA_PROVIDER_AVAILABILITY,
  MARKET_DATA_PROVIDER_CATALOG,
  freezeMarketDataProvider,
  listMarketDataProviders,
  type MarketDataProviderAvailability,
  type MarketDataProviderId,
  type MarketDataProviderMetadata,
  type OfferedMarketDataProviderId,
} from './market-data-provider-catalog';
export {
  describeMarketDataAdapter,
  type MarketDataAdapterContract,
  type MarketDataProviderIdentity,
} from './market-data-adapter.contract';
export { DeclaredMarketDataAdapter, type MarketDataProviderAdapter } from './market-data-adapter';
export {
  MarketDataAdapterRegistry,
  MarketDataProviderAlreadyRegisteredError,
  MarketDataProviderIdentityInvalidError,
  MarketDataProviderNotFoundError,
  createOfferedMarketDataAdapters,
  defaultMarketDataAdapterRegistry,
  lookupMarketDataAdapter,
  selectMarketDataAdapter,
} from './market-data-adapter.registry';
export { MarketDataAdapterFactory } from './market-data-adapter.factory';
export { MarketDataFoundationModule } from './market-data-foundation.module';
export {
  MARKET_SYMBOL_TRADING_STATUSES,
  isMarketSymbolTradingStatus,
  type MarketSymbolTradingStatus,
  type NormalizedMarketSymbol,
  type ProviderSymbolDefinition,
} from './market-symbol';
export { normalizeProviderSymbol, normalizeProviderSymbols } from './market-symbol.normalize';
export {
  MarketSymbolDuplicateError,
  MarketSymbolMalformedPayloadError,
  MarketSymbolValidationError,
  validateAndNormalizeSymbols,
} from './market-symbol.validate';
export {
  projectMarketSymbol,
  projectMarketSymbols,
  projectSymbolDiscovery,
  type MarketSymbolDiscoveryView,
  type MarketSymbolView,
} from './market-symbol.projection';
export { MarketSymbolCache, type MarketSymbolCacheEntry } from './market-symbol.cache';
export {
  MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS,
  type MarketSymbolDiscoveryAdapter,
  type MarketSymbolDiscoveryAdapterKind,
  type MarketSymbolDiscoveryAdapterRequest,
  type MarketSymbolDiscoveryAdapterResult,
} from './market-symbol.discovery';
export { MarketSymbolDiscoveryService } from './market-symbol.service';
export { MarketSymbolDiscoveryAudit } from './market-symbol.audit';
export { BinanceSymbolDiscoveryAdapter, parseBinanceExchangeInfo } from './binance-symbol.adapter';
export { PlannedSymbolDiscoveryAdapter } from './planned-symbol.adapter';
export {
  MARKET_TICKER_FRESHNESS,
  isMarketTickerFreshness,
  type MarketTickerFreshness,
  type NormalizedMarketTicker,
  type ProviderTickerObservation,
} from './market-ticker';
export {
  MARKET_TICKER_FRESH_MAX_AGE_MS,
  MARKET_TICKER_FRESHNESS_CLOCK_SKEW_MS,
  calculateTickerFreshness,
} from './market-ticker.freshness';
export {
  MARKET_TICKER_CLOCK_SKEW_MS,
  isValidExchangeSymbol,
  isValidNormalizedSymbol,
  normalizeProviderTicker,
} from './market-ticker.normalize';
export {
  MarketTickerInvalidSymbolError,
  MarketTickerMalformedPayloadError,
  MarketTickerValidationError,
  validateAndNormalizeTicker,
  validateTickerSymbolRequest,
} from './market-ticker.validate';
export {
  projectMarketTicker,
  projectTickerRetrieval,
  type MarketTickerFieldsView,
  type MarketTickerRetrievalView,
} from './market-ticker.projection';
export { MarketTickerCache, type MarketTickerCacheEntry } from './market-ticker.cache';
export {
  MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS,
  type MarketTickerRetrievalAdapter,
  type MarketTickerRetrievalAdapterKind,
  type MarketTickerRetrievalAdapterRequest,
  type MarketTickerRetrievalAdapterResult,
} from './market-ticker.retrieval';
export { MarketTickerRetrievalService } from './market-ticker.service';
export { MarketTickerRetrievalAudit } from './market-ticker.audit';
export { BinanceTickerRetrievalAdapter, parseBinanceTicker24hr } from './binance-ticker.adapter';
export { PlannedTickerRetrievalAdapter } from './planned-ticker.adapter';
export {
  MARKET_CANDLE_FRESHNESS,
  MARKET_CANDLE_INTERVALS,
  isMarketCandleFreshness,
  isMarketCandleInterval,
  type MarketCandleFreshness,
  type MarketCandleInterval,
  type NormalizedMarketCandle,
  type ProviderCandleObservation,
} from './market-candle';
export {
  MARKET_CANDLE_FRESH_MAX_AGE_MS,
  MARKET_CANDLE_FRESHNESS_CLOCK_SKEW_MS,
  calculateCandleFreshness,
} from './market-candle.freshness';
export { MARKET_CANDLE_CLOCK_SKEW_MS, normalizeProviderCandle } from './market-candle.normalize';
export {
  MarketCandleDuplicateTimestampError,
  MarketCandleInvalidIntervalError,
  MarketCandleInvalidRangeError,
  MarketCandleInvalidSymbolError,
  MarketCandleMalformedPayloadError,
  MarketCandleValidationError,
  validateAndNormalizeCandles,
  validateCandleRetrievalRequest,
} from './market-candle.validate';
export {
  projectCandleRetrieval,
  projectMarketCandle,
  type MarketCandleFieldsView,
  type MarketCandleRetrievalView,
} from './market-candle.projection';
export { MarketCandleCache, type MarketCandleCacheEntry } from './market-candle.cache';
export {
  MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS,
  type MarketCandleRetrievalAdapter,
  type MarketCandleRetrievalAdapterKind,
  type MarketCandleRetrievalAdapterRequest,
  type MarketCandleRetrievalAdapterResult,
} from './market-candle.retrieval';
export { MarketCandleRetrievalService } from './market-candle.service';
export { MarketCandleRetrievalAudit } from './market-candle.audit';
export { BinanceCandleRetrievalAdapter, parseBinanceKlines } from './binance-candle.adapter';
export { PlannedCandleRetrievalAdapter } from './planned-candle.adapter';
