import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { DurableStrategyLibraryCertificationAdapter } from './adapters/durable-strategy-library-certification.adapter';
import { DurableStrategyLibraryReadAdapter } from './adapters/durable-strategy-library-read.adapter';
import { InMemoryStrategyLibraryCertificationAdapter } from './adapters/in-memory-strategy-library-certification.adapter';
import { InMemoryStrategyLibraryReadAdapter } from './adapters/in-memory-strategy-library-read.adapter';
import { STRATEGY_LIBRARY_ELIGIBILITY_PORT } from './ports/strategy-library-eligibility.port';
import { STRATEGY_LIBRARY_LOOKUP_PORT } from './ports/strategy-library-lookup.port';
import { STRATEGY_LIBRARY_CERTIFICATION_PORT } from './ports/strategy-library-certification.port';
import { StrategyLibraryBoundaryService } from './strategy-library-boundary.service';

/**
 * RC-22 Strategy Library Nest module.
 *
 * Domain: Strategy / Version / Certification / Envelope / Eligibility / Lifecycle (RC-22 CLOSED).
 * RC-23 Epic 2: activates read-only Lookup + Eligibility Nest ports for Runtime Enforcement.
 * W3-O01-b: optional durable store snapshot via PERSISTENCE_DRIVER=prisma.
 *
 * Write ports: Certification Nest is active (PC-02). Registration / Lifecycle Nest remain inactive.
 * Distinct from {@link StrategiesModule} (experimental registry) and
 * {@link KnowledgeLakeModule} (projection warehouse).
 *
 * Never depends on Runtime Enforcement (no reverse dependency).
 * PC-01 / PC-02 HTTP transport lives in {@link StrategyLibraryProductModule}.
 */
@Module({
  providers: [
    StrategyLibraryBoundaryService,
    {
      provide: InMemoryStrategyLibraryReadAdapter,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new InMemoryStrategyLibraryReadAdapter(),
          createPrisma: (client) => new DurableStrategyLibraryReadAdapter(client),
          owner: 'strategy-library',
        }),
    },
    {
      provide: InMemoryStrategyLibraryCertificationAdapter,
      useFactory: async (library: InMemoryStrategyLibraryReadAdapter) =>
        createRepositoryByDriver({
          createMemory: () => new InMemoryStrategyLibraryCertificationAdapter(library),
          createPrisma: (client) => new DurableStrategyLibraryCertificationAdapter(client, library),
          owner: 'strategy-library',
        }),
      inject: [InMemoryStrategyLibraryReadAdapter],
    },
    {
      provide: STRATEGY_LIBRARY_LOOKUP_PORT,
      useExisting: InMemoryStrategyLibraryReadAdapter,
    },
    {
      provide: STRATEGY_LIBRARY_ELIGIBILITY_PORT,
      useExisting: InMemoryStrategyLibraryReadAdapter,
    },
    {
      provide: STRATEGY_LIBRARY_CERTIFICATION_PORT,
      useExisting: InMemoryStrategyLibraryCertificationAdapter,
    },
  ],
  exports: [
    StrategyLibraryBoundaryService,
    InMemoryStrategyLibraryReadAdapter,
    InMemoryStrategyLibraryCertificationAdapter,
    STRATEGY_LIBRARY_LOOKUP_PORT,
    STRATEGY_LIBRARY_ELIGIBILITY_PORT,
    STRATEGY_LIBRARY_CERTIFICATION_PORT,
  ],
})
export class StrategyLibraryModule {}
