import { Module } from '@nestjs/common';
import { KnowledgeLakeModule } from '../knowledge-lake';
import { LiveMarketDataModule } from '../live-market-data';
import { InMemoryQualificationStore } from './adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
import { MarketQualificationConsumerReadAdapter } from './adapters/market-qualification-consumer-read.adapter';
import { ResearchOutputReadAdapter } from './adapters/research-output-read.adapter';
import { MarketQualificationBoundaryService } from './market-qualification-boundary.service';
import { MarketQualificationLifecycleService } from './market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from './market-qualification-observational-read.service';
import { MarketQualificationQueryService } from './market-qualification-query.service';
import { MARKET_QUALIFICATION_CONSUMER_READ_PORT } from './ports/market-qualification-consumer.port';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
} from './ports/market-qualification.port';

/**
 * RC-25 — Market Qualification module.
 *
 * Epic 1–4: boundary, reads, domain, lifecycle/query.
 * Epic 6: consumer read ports for future Orchestrator / Reporting / AI.
 *
 * Does not import Runtime Enforcement, Strategy Library, Trading Session,
 * Orders, Execution, Reporting, or AI.
 * Does not expose REST / persistence product / UI / evaluation algorithms.
 *
 * Dependency direction: Live Market Data / Lake → Qualification (reads only).
 */
@Module({
  imports: [LiveMarketDataModule, KnowledgeLakeModule],
  providers: [
    MarketQualificationBoundaryService,
    LiveMarketDataReadAdapter,
    ResearchOutputReadAdapter,
    MarketQualificationObservationalReadService,
    InMemoryQualificationStore,
    MarketQualificationLifecycleService,
    MarketQualificationQueryService,
    MarketQualificationConsumerReadAdapter,
    {
      provide: LIVE_MARKET_DATA_READ_CONSUMER,
      useExisting: LiveMarketDataReadAdapter,
    },
    {
      provide: RESEARCH_OUTPUT_READ_CONSUMER,
      useExisting: ResearchOutputReadAdapter,
    },
    {
      provide: MARKET_QUALIFICATION_SERVICE_PORT,
      useExisting: MarketQualificationLifecycleService,
    },
    {
      provide: MARKET_QUALIFICATION_QUERY_PORT,
      useExisting: MarketQualificationQueryService,
    },
    {
      provide: MARKET_QUALIFICATION_CONSUMER_READ_PORT,
      useExisting: MarketQualificationConsumerReadAdapter,
    },
  ],
  exports: [
    MarketQualificationBoundaryService,
    MarketQualificationObservationalReadService,
    MarketQualificationLifecycleService,
    MarketQualificationQueryService,
    MarketQualificationConsumerReadAdapter,
    LIVE_MARKET_DATA_READ_CONSUMER,
    RESEARCH_OUTPUT_READ_CONSUMER,
    MARKET_QUALIFICATION_SERVICE_PORT,
    MARKET_QUALIFICATION_QUERY_PORT,
    MARKET_QUALIFICATION_CONSUMER_READ_PORT,
  ],
})
export class MarketQualificationModule {}
