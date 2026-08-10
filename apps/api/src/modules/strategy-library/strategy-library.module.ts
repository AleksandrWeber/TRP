import { Module } from '@nestjs/common';
import { InMemoryStrategyLibraryReadAdapter } from './adapters/in-memory-strategy-library-read.adapter';
import { STRATEGY_LIBRARY_ELIGIBILITY_PORT } from './ports/strategy-library-eligibility.port';
import { STRATEGY_LIBRARY_LOOKUP_PORT } from './ports/strategy-library-lookup.port';
import { StrategyLibraryBoundaryService } from './strategy-library-boundary.service';

/**
 * RC-22 Strategy Library Nest module.
 *
 * Domain: Strategy / Version / Certification / Envelope / Eligibility / Lifecycle (RC-22 CLOSED).
 * RC-23 Epic 2: activates read-only Lookup + Eligibility Nest ports for Runtime Enforcement.
 *
 * Write ports (Registration / Certification / Lifecycle Nest) remain inactive.
 * Distinct from {@link StrategiesModule} (experimental registry) and
 * {@link KnowledgeLakeModule} (projection warehouse).
 *
 * Never depends on Runtime Enforcement (no reverse dependency).
 */
@Module({
  providers: [
    StrategyLibraryBoundaryService,
    InMemoryStrategyLibraryReadAdapter,
    {
      provide: STRATEGY_LIBRARY_LOOKUP_PORT,
      useExisting: InMemoryStrategyLibraryReadAdapter,
    },
    {
      provide: STRATEGY_LIBRARY_ELIGIBILITY_PORT,
      useExisting: InMemoryStrategyLibraryReadAdapter,
    },
  ],
  exports: [
    StrategyLibraryBoundaryService,
    InMemoryStrategyLibraryReadAdapter,
    STRATEGY_LIBRARY_LOOKUP_PORT,
    STRATEGY_LIBRARY_ELIGIBILITY_PORT,
  ],
})
export class StrategyLibraryModule {}
