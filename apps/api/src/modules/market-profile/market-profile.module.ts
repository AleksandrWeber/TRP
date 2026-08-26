import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { MarketQualificationModule } from '../market-qualification';
import { DurableMarketProfileStore } from './adapters/durable-market-profile-store';
import { InMemoryMarketProfileStore } from './adapters/in-memory-market-profile-store';
import { MarketProfileConsumerReadAdapter } from './adapters/market-profile-consumer-read.adapter';
import { MarketProfileBoundaryService } from './market-profile-boundary.service';
import { MarketProfileObservationalReadService } from './market-profile-observational-read.service';
import { MarketProfileQueryService } from './market-profile-query.service';
import { MarketProfileVersioningService } from './market-profile-versioning.service';
import { MARKET_PROFILE_CONSUMER_READ_PORT } from './ports/market-profile-consumer.port';
import {
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
} from './ports/market-profile.port';

/**
 * RC-25 — Market Profile module.
 *
 * Epic 1–5: boundary, observational reads, domain, versioning.
 * Epic 6: consumer read ports for future Orchestrator / Reporting / AI.
 * W3-O01-b: optional durable store snapshot via PERSISTENCE_DRIVER=prisma.
 *
 * Dependency direction: Qualification → Profile (one-way).
 * Does not import Live Market Data directly, Runtime Enforcement,
 * Strategy Library, Trading Session, Orders, Execution, Reporting, or AI.
 * Does not expose REST / persistence product / calculation algorithms.
 */
@Module({
  imports: [MarketQualificationModule],
  providers: [
    MarketProfileBoundaryService,
    MarketProfileObservationalReadService,
    {
      provide: InMemoryMarketProfileStore,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new InMemoryMarketProfileStore(),
          createPrisma: (client) => new DurableMarketProfileStore(client),
          owner: 'market-profile',
        }),
    },
    MarketProfileVersioningService,
    MarketProfileQueryService,
    MarketProfileConsumerReadAdapter,
    {
      provide: MARKET_PROFILE_SERVICE_PORT,
      useExisting: MarketProfileVersioningService,
    },
    {
      provide: MARKET_PROFILE_QUERY_PORT,
      useExisting: MarketProfileQueryService,
    },
    {
      provide: MARKET_PROFILE_CONSUMER_READ_PORT,
      useExisting: MarketProfileConsumerReadAdapter,
    },
  ],
  exports: [
    MarketProfileBoundaryService,
    MarketProfileObservationalReadService,
    MarketProfileVersioningService,
    MarketProfileQueryService,
    MarketProfileConsumerReadAdapter,
    MARKET_PROFILE_SERVICE_PORT,
    MARKET_PROFILE_QUERY_PORT,
    MARKET_PROFILE_CONSUMER_READ_PORT,
  ],
})
export class MarketProfileModule {}
