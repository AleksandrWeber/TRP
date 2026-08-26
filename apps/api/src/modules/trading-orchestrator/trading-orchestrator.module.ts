import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { RuntimeEnforcementModule } from '../runtime-enforcement';
import { StrategyLibraryModule } from '../strategy-library';
import { DurableOrchestrationCoordinationStore } from './adapters/durable-orchestration-coordination.store';
import { InMemoryOrchestratorMarketStateAdapter } from './adapters/in-memory-market-state.adapter';
import { NullOrchestratorRiskPolicyReadAdapter } from './adapters/risk-policy-read.adapter';
import { OrchestratorRuntimeEnforcementConsumerAdapter } from './adapters/runtime-enforcement-consumer.adapter';
import { OrchestratorStrategyLibraryConsumerAdapter } from './adapters/strategy-library-consumer.adapter';
import { TradingOrchestratorConsumerReadAdapter } from './adapters/trading-orchestrator-consumer-read.adapter';
import { OrchestrationCoordinationStore } from './application/orchestration-coordination.store';
import { OrchestrationWorkflowCoordinator } from './application/orchestration-workflow.coordinator';
import { TradingOrchestratorQueryService } from './application/trading-orchestrator-query.service';
import { TradingOrchestratorService } from './application/trading-orchestrator.service';
import {
  ORCHESTRATOR_MARKET_STATE_CONSUMER,
  ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
} from './ports/trading-orchestrator.port';
import { TradingOrchestratorBoundaryService } from './trading-orchestrator-boundary.service';

/**
 * RC-26 — Trading Orchestrator module.
 *
 * Epic 6: Consumer read port for Reporting / AI / Command Center.
 * W3-O01-b: optional durable coordination store via PERSISTENCE_DRIVER=prisma.
 * Does not import Trading Session / Orders / Risk / Execution / Reporting / AI.
 */
@Module({
  imports: [StrategyLibraryModule, RuntimeEnforcementModule],
  providers: [
    TradingOrchestratorBoundaryService,
    InMemoryOrchestratorMarketStateAdapter,
    NullOrchestratorRiskPolicyReadAdapter,
    OrchestratorStrategyLibraryConsumerAdapter,
    OrchestratorRuntimeEnforcementConsumerAdapter,
    {
      provide: OrchestrationCoordinationStore,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new OrchestrationCoordinationStore(),
          createPrisma: (client) => new DurableOrchestrationCoordinationStore(client),
        }),
    },
    OrchestrationWorkflowCoordinator,
    TradingOrchestratorService,
    TradingOrchestratorQueryService,
    TradingOrchestratorConsumerReadAdapter,
    {
      provide: ORCHESTRATOR_MARKET_STATE_CONSUMER,
      useExisting: InMemoryOrchestratorMarketStateAdapter,
    },
    {
      provide: ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
      useExisting: NullOrchestratorRiskPolicyReadAdapter,
    },
    {
      provide: ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
      useExisting: OrchestratorStrategyLibraryConsumerAdapter,
    },
    {
      provide: ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
      useExisting: OrchestratorRuntimeEnforcementConsumerAdapter,
    },
    {
      provide: TRADING_ORCHESTRATOR_SERVICE_PORT,
      useExisting: TradingOrchestratorService,
    },
    {
      provide: TRADING_ORCHESTRATOR_QUERY_PORT,
      useExisting: TradingOrchestratorQueryService,
    },
    {
      provide: TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
      useExisting: TradingOrchestratorConsumerReadAdapter,
    },
  ],
  exports: [
    TradingOrchestratorBoundaryService,
    InMemoryOrchestratorMarketStateAdapter,
    OrchestrationCoordinationStore,
    TRADING_ORCHESTRATOR_SERVICE_PORT,
    TRADING_ORCHESTRATOR_QUERY_PORT,
    TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
    ORCHESTRATOR_MARKET_STATE_CONSUMER,
    ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
    ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
    ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
  ],
})
export class TradingOrchestratorModule {}
