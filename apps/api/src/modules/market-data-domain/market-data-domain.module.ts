import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MarketDataCacheModule } from '../market-data-cache/market-data-cache.module';
import { MarketDataDomainController } from './market-data-domain.controller';
import { MarketDataDomainErrorFilter } from './market-data-domain-error.filter';
import {
  MARKET_DATA_PROVIDER_ENV_VAR,
  resolveMarketDataProviderId,
} from './market-data-provider.config';
import type { MarketDataProvider } from './ports/market-data-provider';
import { MarketDataProviderRegistry } from './ports/market-data-provider-registry';
import { MARKET_DATA_PROVIDER } from './ports/market-data-provider.token';
import { BinanceMarketDataProvider } from './providers/binance-market-data-provider';
import { MockMarketDataProvider } from './providers/mock-market-data-provider';

/**
 * Market Data Domain Nest module (US006 / US007 / US008).
 * Provider-agnostic current-market reads: registry + active provider behind
 * the MarketDataProvider port. Both the mock and the Binance provider are
 * registered; MARKET_DATA_PROVIDER (default: mock) selects the active one —
 * consumers and the controller never know which implementation serves them.
 *
 * MarketDataCacheModule (US008) sits between the controller and the provider:
 * ticker/candle reads go through MarketDataCacheService, which invokes the
 * provider only on a cache miss. Providers stay unchanged.
 *
 * Independent of Strategy / Workspace / Auth and of the historical
 * MarketDataModule (US115) / MarketDataProviderModule (US117).
 */
@Module({
  imports: [MarketDataCacheModule],
  controllers: [MarketDataDomainController],
  providers: [
    {
      provide: MarketDataProviderRegistry,
      useFactory: (config: ConfigService) => {
        const registry = new MarketDataProviderRegistry();
        registry.register(new MockMarketDataProvider());
        registry.register(new BinanceMarketDataProvider());
        registry.setActive(
          resolveMarketDataProviderId(
            config.get<string>(MARKET_DATA_PROVIDER_ENV_VAR),
            registry.list(),
          ),
        );
        return registry;
      },
      inject: [ConfigService],
    },
    {
      provide: MARKET_DATA_PROVIDER,
      useFactory: (registry: MarketDataProviderRegistry): MarketDataProvider =>
        registry.getActive(),
      inject: [MarketDataProviderRegistry],
    },
    {
      // Catches MarketDataDomainError only — all other exceptions keep their
      // existing handling.
      provide: APP_FILTER,
      useClass: MarketDataDomainErrorFilter,
    },
  ],
  exports: [MarketDataProviderRegistry, MARKET_DATA_PROVIDER],
})
export class MarketDataDomainModule {}
