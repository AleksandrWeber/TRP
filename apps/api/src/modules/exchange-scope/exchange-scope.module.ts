import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { DurableExchangeScopeStore } from './adapters/durable-exchange-scope-store';
import { ExchangeScopeConsumerReadAdapter } from './adapters/exchange-scope-consumer-read.adapter';
import { InMemoryExchangeScopeStore } from './adapters/in-memory-exchange-scope-store';
import { ExchangeScopeBoundaryService } from './exchange-scope-boundary.service';
import { ExchangeScopeConsumerReadService } from './exchange-scope-consumer-read.service';
import { ExchangeScopeLifecycleService } from './exchange-scope-lifecycle.service';
import { ExchangeScopeQueryService } from './exchange-scope-query.service';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_QUERY_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
} from './ports/exchange-scope.port';

/**
 * RC-27 — Exchange Scope module.
 *
 * Epic 3: Application ports active (service / query).
 * Epic 5: Consumer-read Nest façade + query adapter (immutable projections).
 * W3-O01-b: optional durable store snapshot via PERSISTENCE_DRIVER=prisma.
 * No trading-path commands. No REST. No transport.
 *
 * Does not import Runtime, Orders, Execution, Session, Reporting,
 * Strategy Library, Runtime Enforcement, Market State, Orchestrator,
 * Risk, Accounting, or Knowledge Lake.
 */
@Module({
  providers: [
    ExchangeScopeBoundaryService,
    {
      provide: InMemoryExchangeScopeStore,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new InMemoryExchangeScopeStore(),
          createPrisma: (client) => new DurableExchangeScopeStore(client),
        }),
    },
    ExchangeScopeLifecycleService,
    ExchangeScopeQueryService,
    ExchangeScopeConsumerReadAdapter,
    ExchangeScopeConsumerReadService,
    {
      provide: EXCHANGE_SCOPE_SERVICE_PORT,
      useExisting: ExchangeScopeLifecycleService,
    },
    {
      provide: EXCHANGE_SCOPE_QUERY_PORT,
      useExisting: ExchangeScopeQueryService,
    },
    {
      provide: EXCHANGE_SCOPE_CONSUMER_READ_PORT,
      useExisting: ExchangeScopeConsumerReadService,
    },
  ],
  exports: [
    ExchangeScopeBoundaryService,
    InMemoryExchangeScopeStore,
    ExchangeScopeConsumerReadService,
    EXCHANGE_SCOPE_SERVICE_PORT,
    EXCHANGE_SCOPE_QUERY_PORT,
    EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  ],
})
export class ExchangeScopeModule {}
