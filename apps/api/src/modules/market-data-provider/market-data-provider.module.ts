import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { LocalRepositoryProvider } from './local-repository.provider';
import { MARKET_DATA_PROVIDERS } from './market-data-providers.token';
import { ProviderRegistry } from './provider-registry';

/**
 * Market data provider Nest module (US117).
 * Pluggable historical sources — LocalRepositoryProvider first.
 * No REST / live data / external API calls / Prisma.
 */
@Module({
  imports: [MarketDataModule],
  providers: [
    LocalRepositoryProvider,
    {
      provide: MARKET_DATA_PROVIDERS,
      useFactory: (local: LocalRepositoryProvider) => [local],
      inject: [LocalRepositoryProvider],
    },
    ProviderRegistry,
  ],
  exports: [ProviderRegistry, LocalRepositoryProvider],
})
export class MarketDataProviderModule {}
