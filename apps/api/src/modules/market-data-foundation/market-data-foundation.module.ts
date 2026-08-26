import { Module } from '@nestjs/common';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { BinanceCandleRetrievalAdapter } from './binance-candle.adapter';
import { BinanceSymbolDiscoveryAdapter } from './binance-symbol.adapter';
import { BinanceTickerRetrievalAdapter } from './binance-ticker.adapter';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import { MarketDataSymbolsController } from './market-data-symbols.controller';
import { MarketCandleCache } from './market-candle.cache';
import { MarketCandleRetrievalAudit } from './market-candle.audit';
import {
  CANDLE_RETRIEVAL_HTTP_CLIENT,
  CANDLE_RETRIEVAL_TIMEOUT_MS,
  DEFAULT_CANDLE_RETRIEVAL_TIMEOUT_MS,
  FetchCandleRetrievalHttpClient,
} from './market-candle.http';
import { MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS } from './market-candle.retrieval';
import { MarketCandleRetrievalService } from './market-candle.service';
import { PlannedCandleRetrievalAdapter } from './planned-candle.adapter';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketSymbolDiscoveryAudit } from './market-symbol.audit';
import { MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS } from './market-symbol.discovery';
import {
  DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS,
  FetchSymbolDiscoveryHttpClient,
  SYMBOL_DISCOVERY_HTTP_CLIENT,
  SYMBOL_DISCOVERY_TIMEOUT_MS,
} from './market-symbol.http';
import { MarketSymbolDiscoveryService } from './market-symbol.service';
import { PlannedSymbolDiscoveryAdapter } from './planned-symbol.adapter';
import { MarketTickerCache } from './market-ticker.cache';
import { MarketTickerRetrievalAudit } from './market-ticker.audit';
import {
  DEFAULT_TICKER_RETRIEVAL_TIMEOUT_MS,
  FetchTickerRetrievalHttpClient,
  TICKER_RETRIEVAL_HTTP_CLIENT,
  TICKER_RETRIEVAL_TIMEOUT_MS,
} from './market-ticker.http';
import { MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS } from './market-ticker.retrieval';
import { MarketTickerRetrievalService } from './market-ticker.service';
import { PlannedTickerRetrievalAdapter } from './planned-ticker.adapter';

/**
 * Market Data Foundation module.
 *
 * W2-S03-a: provider identity, capability metadata, static availability,
 * adapter contract, registry, and factory/resolver.
 * W2-S03-b: exchange symbol discovery, normalization, validation, cache,
 * and projection.
 * W2-S03-c: ticker retrieval, normalization, validation, freshness, cache,
 * and projection.
 * W2-S03-d: candlestick retrieval, OHLCV normalization, validation, freshness,
 * cache, and projection. Order book remains a later slice.
 */
@Module({
  imports: [WorkspaceModule, SecurityAuditModule],
  controllers: [MarketDataSymbolsController],
  providers: [
    {
      provide: MarketDataAdapterRegistry,
      useFactory: () => new MarketDataAdapterRegistry(),
    },
    {
      provide: MarketDataAdapterFactory,
      useFactory: (registry: MarketDataAdapterRegistry) => new MarketDataAdapterFactory(registry),
      inject: [MarketDataAdapterRegistry],
    },
    FetchSymbolDiscoveryHttpClient,
    {
      provide: SYMBOL_DISCOVERY_HTTP_CLIENT,
      useExisting: FetchSymbolDiscoveryHttpClient,
    },
    {
      provide: SYMBOL_DISCOVERY_TIMEOUT_MS,
      useValue: DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS,
    },
    BinanceSymbolDiscoveryAdapter,
    {
      provide: MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS,
      useFactory: (binance: BinanceSymbolDiscoveryAdapter) => [
        binance,
        new PlannedSymbolDiscoveryAdapter('BYBIT'),
        new PlannedSymbolDiscoveryAdapter('OKX'),
      ],
      inject: [BinanceSymbolDiscoveryAdapter],
    },
    MarketSymbolCache,
    MarketSymbolDiscoveryAudit,
    MarketSymbolDiscoveryService,
    FetchTickerRetrievalHttpClient,
    {
      provide: TICKER_RETRIEVAL_HTTP_CLIENT,
      useExisting: FetchTickerRetrievalHttpClient,
    },
    {
      provide: TICKER_RETRIEVAL_TIMEOUT_MS,
      useValue: DEFAULT_TICKER_RETRIEVAL_TIMEOUT_MS,
    },
    BinanceTickerRetrievalAdapter,
    {
      provide: MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS,
      useFactory: (binance: BinanceTickerRetrievalAdapter) => [
        binance,
        new PlannedTickerRetrievalAdapter('BYBIT'),
        new PlannedTickerRetrievalAdapter('OKX'),
      ],
      inject: [BinanceTickerRetrievalAdapter],
    },
    MarketTickerCache,
    MarketTickerRetrievalAudit,
    MarketTickerRetrievalService,
    FetchCandleRetrievalHttpClient,
    {
      provide: CANDLE_RETRIEVAL_HTTP_CLIENT,
      useExisting: FetchCandleRetrievalHttpClient,
    },
    {
      provide: CANDLE_RETRIEVAL_TIMEOUT_MS,
      useValue: DEFAULT_CANDLE_RETRIEVAL_TIMEOUT_MS,
    },
    BinanceCandleRetrievalAdapter,
    {
      provide: MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS,
      useFactory: (binance: BinanceCandleRetrievalAdapter) => [
        binance,
        new PlannedCandleRetrievalAdapter('BYBIT'),
        new PlannedCandleRetrievalAdapter('OKX'),
      ],
      inject: [BinanceCandleRetrievalAdapter],
    },
    MarketCandleCache,
    MarketCandleRetrievalAudit,
    MarketCandleRetrievalService,
  ],
  exports: [
    MarketDataAdapterRegistry,
    MarketDataAdapterFactory,
    MarketSymbolDiscoveryService,
    MarketSymbolCache,
    MarketTickerRetrievalService,
    MarketTickerCache,
    MarketCandleRetrievalService,
    MarketCandleCache,
  ],
})
export class MarketDataFoundationModule {}
