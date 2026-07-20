import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketDataCacheRegistry } from './market-data-cache-registry';
import {
  MARKET_CACHE_CANDLES_TTL_ENV_VAR,
  MARKET_CACHE_ENABLED_ENV_VAR,
  MARKET_CACHE_TICKER_TTL_ENV_VAR,
  MARKET_DATA_CACHE_CONFIG,
  resolveMarketDataCacheConfig,
  type MarketDataCacheConfig,
} from './market-data-cache.config';
import { MarketDataCacheService } from './market-data-cache.service';

/**
 * Market Data Cache Nest module (US008).
 * Independent, provider-agnostic in-memory TTL cache between the market
 * controller and the active MarketDataProvider. Imports nothing from the
 * Market Data Domain module — consumers (the domain controller) import this
 * module and route provider reads through MarketDataCacheService.
 *
 * Config is env-driven (MARKET_CACHE_ENABLED / MARKET_CACHE_TICKER_TTL /
 * MARKET_CACHE_CANDLES_TTL) and validated at bootstrap — invalid values fail
 * fast, mirroring the MARKET_DATA_PROVIDER policy.
 */
@Module({
  providers: [
    {
      provide: MARKET_DATA_CACHE_CONFIG,
      useFactory: (config: ConfigService): MarketDataCacheConfig =>
        resolveMarketDataCacheConfig({
          enabled: config.get<string>(MARKET_CACHE_ENABLED_ENV_VAR),
          tickerTtlSeconds: config.get<string>(MARKET_CACHE_TICKER_TTL_ENV_VAR),
          candlesTtlSeconds: config.get<string>(MARKET_CACHE_CANDLES_TTL_ENV_VAR),
        }),
      inject: [ConfigService],
    },
    MarketDataCacheRegistry,
    MarketDataCacheService,
  ],
  exports: [MarketDataCacheService, MarketDataCacheRegistry, MARKET_DATA_CACHE_CONFIG],
})
export class MarketDataCacheModule {}
