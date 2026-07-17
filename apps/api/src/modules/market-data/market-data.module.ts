import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { InMemoryMarketDataRepository } from './repositories/in-memory-market-data.repository';
import { MARKET_DATA_REPOSITORY } from './repositories/market-data.repository.token';
import { MarketDataDomainService } from './market-data-domain.service';

/**
 * Market Data Nest module (US115).
 * Historical / simulation foundation — InMemory only.
 * No REST / Prisma / Pipeline / Backtesting.
 */
@Module({
  providers: [
    {
      provide: MARKET_DATA_REPOSITORY,
      useFactory: (metrics: Metrics) =>
        instrumentRepository(new InMemoryMarketDataRepository(), metrics, 'market-data'),
      inject: [METRICS],
    },
    MarketDataDomainService,
  ],
  exports: [MarketDataDomainService],
})
export class MarketDataModule {}
