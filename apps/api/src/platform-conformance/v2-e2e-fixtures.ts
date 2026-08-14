/**
 * RC-28 Epic 4 — shared in-memory seeds for existing ports.
 *
 * Test helpers only. Not a Nest module. Not a new workflow engine.
 */

import { Test } from '@nestjs/testing';
import { OutboxDispatcher } from '../modules/event-processing';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { InMemoryTelegramAdapter } from '../modules/notification-delivery/adapters/in-memory-telegram.adapter';
import { NotificationDeliveryModule } from '../modules/notification-delivery/notification-delivery.module';
import { NotificationDeliveryService } from '../modules/notification-delivery/notification-delivery.service';
import { NOTIFICATION_SERVICE_PORT } from '../modules/notification-delivery/ports/notification.port';
import { InMemoryOrchestratorMarketStateAdapter } from '../modules/trading-orchestrator/adapters/in-memory-market-state.adapter';
import {
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
  type OrchestratorRuntimeEnforcementConsumerPort,
  type TradingOrchestratorQueryPort,
  type TradingOrchestratorServicePort,
} from '../modules/trading-orchestrator/ports/trading-orchestrator.port';
import { TradingOrchestratorModule } from '../modules/trading-orchestrator/trading-orchestrator.module';
import { InMemoryStrategyLibraryReadAdapter } from '../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../modules/strategy-library/domain/strategy';
import { createStrategyCertification } from '../modules/strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../modules/strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../modules/strategy-library/domain/strategy-version';
import type { StrategyVersionRecord } from '../modules/strategy-library/ports/strategy-library-lookup.port';
import { AiAnalyticsModule } from '../modules/ai-analytics/ai-analytics.module';
import {
  AI_ANALYTICS_PORT,
  type AIAnalyticsPort,
} from '../modules/ai-analytics/ports/ai-analytics.port';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportingQueryPort,
  type ReportingServicePort,
} from '../modules/reporting/ports/reporting.port';

export const E2E_AS_OF = '2026-08-14T18:00:00.000Z';
export const E2E_CREATED_AT = '2026-08-14T12:00:00.000Z';
export const E2E_CERTIFIED_AT = '2026-08-14T13:00:00.000Z';
export const E2E_EVALUATED_AT = '2026-08-14T14:00:00.000Z';

export function e2eEnvelope() {
  return {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
    allowedTimeframes: ['1h', '4h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
  };
}

export function e2eCertifiedRecord(): StrategyVersionRecord {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId: 'ws-1',
    createdAt: E2E_CREATED_AT,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h', '4h'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
    workspaceId: 'ws-1',
    createdAt: E2E_CREATED_AT,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt: E2E_CERTIFIED_AT,
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: e2eEnvelope(),
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt: E2E_EVALUATED_AT,
  });
  return Object.freeze({
    authorityClass: 'source_of_truth',
    strategy,
    version,
    certification,
    eligibility,
    tacticalEnvelope: certification.tacticalEnvelope,
    membershipStatus: 'certified',
  });
}

export function e2eLibraryReads(record: StrategyVersionRecord) {
  return {
    getByLibraryEntryId: (id: string) => (id === record.version.libraryEntryId ? record : null),
    getByFamilyVersion: (familyId: string, version: string) =>
      familyId === record.strategy.strategyFamilyId && version === record.version.version
        ? record
        : null,
    familyExistsInWorkspace: (workspaceId: string, familyId: string) =>
      workspaceId === record.strategy.workspaceId && familyId === record.strategy.strategyFamilyId,
  };
}

export function seedOrchestratorLibrary(adapter: InMemoryStrategyLibraryReadAdapter): void {
  const record = e2eCertifiedRecord();
  adapter.seedEntry({
    strategy: record.strategy,
    version: record.version,
    certification: record.certification!,
    eligibility: record.eligibility!,
  });
}

export async function bootOrchestratorScenario() {
  const moduleRef = await Test.createTestingModule({
    imports: [TradingOrchestratorModule],
  }).compile();
  const library = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
  seedOrchestratorLibrary(library);
  const marketState = moduleRef.get(InMemoryOrchestratorMarketStateAdapter);
  marketState.seedCurrent({
    marketStateId: 'ms-1',
    workspaceId: 'ws-1',
    exchangeScopeId: 'binance-spot',
    marketSymbol: 'BTCUSDT',
    version: 1,
    lifecycleStatus: 'active',
    authorityClass: 'market_state_artifact',
    forcesTrade: false,
    isQualification: false,
    isProfile: false,
  });
  return {
    moduleRef,
    library,
    marketState,
    service: moduleRef.get<TradingOrchestratorServicePort>(TRADING_ORCHESTRATOR_SERVICE_PORT),
    query: moduleRef.get<TradingOrchestratorQueryPort>(TRADING_ORCHESTRATOR_QUERY_PORT),
    gateConsumer: moduleRef.get<OrchestratorRuntimeEnforcementConsumerPort>(
      ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
    ),
  };
}

const silentOutbox = {
  register: () => undefined,
  stop: async () => undefined,
  start: () => undefined,
};

export async function bootProjectionScenario() {
  const moduleRef = await Test.createTestingModule({
    imports: [AiAnalyticsModule],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue(silentOutbox)
    .compile();
  return {
    moduleRef,
    lake: moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter),
    reporting: moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT),
    reportingQuery: moduleRef.get<ReportingQueryPort>(REPORTING_QUERY_PORT),
    ai: moduleRef.get<AIAnalyticsPort>(AI_ANALYTICS_PORT),
  };
}

export async function bootNotificationScenario() {
  const moduleRef = await Test.createTestingModule({
    imports: [NotificationDeliveryModule],
  }).compile();
  return {
    moduleRef,
    service: moduleRef.get(NotificationDeliveryService),
    port: moduleRef.get<NotificationDeliveryService>(NOTIFICATION_SERVICE_PORT),
    telegram: moduleRef.get(InMemoryTelegramAdapter),
  };
}
