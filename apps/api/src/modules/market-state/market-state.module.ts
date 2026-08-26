import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { LiveMarketDataModule } from '../live-market-data/live-market-data.module';
import { MarketQualificationModule } from '../market-qualification';
import { MarketProfileModule } from '../market-profile';
import { DurableMarketStateProjectionStore } from './adapters/durable-market-state-projection.store';
import { MarketStateLiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
import { MarketStateConsumerReadAdapter } from './adapters/market-state-consumer-read.adapter';
import { MarketStateProfileReadAdapter } from './adapters/profile-consumer-read.adapter';
import { MarketStateQualificationReadAdapter } from './adapters/qualification-consumer-read.adapter';
import { MarketStateProjectionStore } from './domain/market-state-projection.store';
import { MarketStateBoundaryService } from './market-state-boundary.service';
import { MarketStateObservationalReadService } from './market-state-observational-read.service';
import {
  MARKET_STATE_CONSUMER_READ_PORT,
  MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_STATE_PROFILE_CONSUMER,
  MARKET_STATE_QUALIFICATION_CONSUMER,
} from './ports/market-state.port';

/**
 * RC-26 — Market State module.
 *
 * Epic 6: Consumer read port for Reporting / AI / Command Center.
 * Classify/query Nest ports remain inactive (no classification algorithms).
 * W3-O01-b: optional durable projection store via PERSISTENCE_DRIVER=prisma.
 *
 * Does not import Runtime Enforcement, Strategy Library, Trading Session,
 * Orders, Execution, Risk, Reporting, AI, or Trading Orchestrator.
 */
@Module({
  imports: [LiveMarketDataModule, MarketQualificationModule, MarketProfileModule],
  providers: [
    MarketStateBoundaryService,
    MarketStateLiveMarketDataReadAdapter,
    MarketStateQualificationReadAdapter,
    MarketStateProfileReadAdapter,
    MarketStateObservationalReadService,
    {
      provide: MarketStateProjectionStore,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new MarketStateProjectionStore(),
          createPrisma: (client) => new DurableMarketStateProjectionStore(client),
        }),
    },
    MarketStateConsumerReadAdapter,
    {
      provide: MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
      useExisting: MarketStateLiveMarketDataReadAdapter,
    },
    {
      provide: MARKET_STATE_QUALIFICATION_CONSUMER,
      useExisting: MarketStateQualificationReadAdapter,
    },
    {
      provide: MARKET_STATE_PROFILE_CONSUMER,
      useExisting: MarketStateProfileReadAdapter,
    },
    {
      provide: MARKET_STATE_CONSUMER_READ_PORT,
      useExisting: MarketStateConsumerReadAdapter,
    },
  ],
  exports: [
    MarketStateBoundaryService,
    MarketStateObservationalReadService,
    MarketStateProjectionStore,
    MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
    MARKET_STATE_QUALIFICATION_CONSUMER,
    MARKET_STATE_PROFILE_CONSUMER,
    MARKET_STATE_CONSUMER_READ_PORT,
  ],
})
export class MarketStateModule {}
