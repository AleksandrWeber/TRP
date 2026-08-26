/**
 * W3-O01-a — Durable Analytical Stores inventory foundation.
 *
 * Discovery and durability preparation only.
 * Not a persistence product. Not a new bounded context. Not a Source of Truth.
 * Existing Version 2 owners remain the sole persistence owners of their artifacts.
 *
 * Residual vocabulary `durable-persistence-product` (TD-048) is debt label only.
 */

import { AI_ANALYTICS_PORTS_ACTIVE } from '../modules/ai-analytics/ports/ai-analytics.port';
import { EXCHANGE_SCOPE_PORTS_ACTIVE } from '../modules/exchange-scope/ports/exchange-scope.port';
import { KNOWLEDGE_LAKE_BOUNDARY } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { MARKET_PROFILE_PORTS_ACTIVE } from '../modules/market-profile/ports/market-profile.port';
import { MARKET_QUALIFICATION_PORTS_ACTIVE } from '../modules/market-qualification/ports/market-qualification.port';
import { MARKET_STATE_PORTS_ACTIVE } from '../modules/market-state/ports/market-state.port';
import { NOTIFICATION_PORTS_ACTIVE } from '../modules/notification-delivery/ports/notification.port';
import { REPORTING_PORTS_ACTIVE } from '../modules/reporting/ports/reporting.port';
import { RUNTIME_ENFORCEMENT_PORTS_ACTIVE } from '../modules/runtime-enforcement/ports/runtime-enforcement.port';
import { STRATEGY_LIBRARY_BOUNDARY } from '../modules/strategy-library/domain/strategy-library-boundary';
import { TRADING_ORCHESTRATOR_PORTS_ACTIVE } from '../modules/trading-orchestrator/ports/trading-orchestrator.port';

export const W3_O01_A_SLICE_ID = 'W3-O01-a' as const;

export const W3_O01_A_ALLOWED_OWNERS = Object.freeze([
  'reporting',
  'notification-delivery',
  'trading-orchestrator',
  'knowledge-lake',
  'ai-analytics',
  'market-profile',
  'market-qualification',
  'market-state',
  'exchange-scope',
  'strategy-library',
  'runtime-enforcement',
] as const);

export type W3O01AOwner = (typeof W3_O01_A_ALLOWED_OWNERS)[number];

export const W3_O01_A_DURABILITY_CLASSES = Object.freeze(['SURVIVE', 'EPHEMERAL'] as const);

export type W3O01ADurabilityClass = (typeof W3_O01_A_DURABILITY_CLASSES)[number];

export const W3_O01_A_FUTURE_SLICES = Object.freeze([
  'W3-O01-b',
  'W3-O01-c',
  'W3-O01-d',
  'W3-O02',
  'honesty-baseline',
] as const);

export type W3O01AFutureSlice = (typeof W3_O01_A_FUTURE_SLICES)[number];

export type W3O01AInventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  owner: W3O01AOwner;
  persistenceToday: 'process-local-in-memory' | 'durable-owner-snapshot' | 'none-derived-on-read';
  storeEvidence: string;
  portEvidence: string;
  requiredDurability: W3O01ADurabilityClass;
  restartSurvivability: 'does-not-survive-today' | 'n/a-derived';
  currentRisk: string;
  futureSlice: W3O01AFutureSlice;
  honestyNote: string;
  operatorRelied: boolean;
}>;

/**
 * Frozen inventory of certified V2 analytical artifacts under TD-048 / IN-01.
 * Each artifact has exactly one existing owner. No new persistence owner.
 */
export const W3_O01_A_ANALYTICAL_INVENTORY: readonly W3O01AInventoryRow[] = Object.freeze([
  Object.freeze({
    artifactId: 'report-definition',
    artifact: 'ReportDefinition',
    owner: 'reporting',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/reporting/adapters/in-memory-reporting-store.ts',
    portEvidence: 'apps/api/src/modules/reporting/ports/reporting.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Report definitions disappear after API restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'report-run',
    artifact: 'ReportRun',
    owner: 'reporting',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/reporting/adapters/in-memory-reporting-store.ts',
    portEvidence: 'apps/api/src/modules/reporting/ports/reporting.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Operator report history and runs are silently lost on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'aggregation-slice',
    artifact: 'AggregationSlice',
    owner: 'reporting',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/reporting/adapters/in-memory-reporting-store.ts',
    portEvidence: 'apps/api/src/modules/reporting/ports/reporting.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Report detail/compare aggregations empty after restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Survives with owning ReportRun; no separate SoT',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'user-notification-preferences',
    artifact: 'UserNotificationPreferences',
    owner: 'notification-delivery',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/notification-delivery/adapters/in-memory-notification-store.ts',
    portEvidence: 'apps/api/src/modules/notification-delivery/ports/notification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Notification preference settings wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Distinct from W3-O02 durable delivery queue',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'telegram-connection-state',
    artifact: 'TelegramConnection',
    owner: 'notification-delivery',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/notification-delivery/adapters/in-memory-notification-store.ts',
    portEvidence: 'apps/api/src/modules/notification-delivery/ports/notification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'In-product Telegram connect state lost on restart',
    futureSlice: 'W3-O01-c',
    honestyNote:
      'Notification-delivery connect state; Wave 2 ConnectionRecord metadata is separate',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'delivery-result-history',
    artifact: 'DeliveryResult',
    owner: 'notification-delivery',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/notification-delivery/adapters/in-memory-notification-store.ts',
    portEvidence: 'apps/api/src/modules/notification-delivery/ports/notification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Delivery history empty after restart; not the durable queue',
    futureSlice: 'W3-O01-c',
    honestyNote: 'History survival is O01; in-flight queue durability is W3-O02',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'orchestration-plan',
    artifact: 'OrchestrationPlan',
    owner: 'trading-orchestrator',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/trading-orchestrator/application/orchestration-coordination.store.ts',
    portEvidence: 'apps/api/src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Orchestration plans disappear after restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'orchestration-run',
    artifact: 'OrchestrationRun',
    owner: 'trading-orchestrator',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/trading-orchestrator/application/orchestration-coordination.store.ts',
    portEvidence: 'apps/api/src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Orchestration runs and history wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'selection-decision',
    artifact: 'SelectionDecision',
    owner: 'trading-orchestrator',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/trading-orchestrator/application/orchestration-coordination.store.ts',
    portEvidence: 'apps/api/src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Selection decision audit trail lost on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'session-handoff-intent',
    artifact: 'SessionHandoffIntent',
    owner: 'trading-orchestrator',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/trading-orchestrator/application/orchestration-coordination.store.ts',
    portEvidence: 'apps/api/src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Handoff intent lost; TradingSession may remain durable separately',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Does not own TradingSession; Session remains external durable owner',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'orchestrator-market-state-seed-buffer',
    artifact: 'OrchestratorMarketStateView',
    owner: 'trading-orchestrator',
    persistenceToday: 'process-local-in-memory',
    storeEvidence:
      'apps/api/src/modules/trading-orchestrator/adapters/in-memory-market-state.adapter.ts',
    portEvidence: 'apps/api/src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
    requiredDurability: 'EPHEMERAL',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Seed-only consumer buffer; not Market State SoT',
    futureSlice: 'honesty-baseline',
    honestyNote: 'Honest ephemeral seed buffer; Market State owns market-state artifacts',
    operatorRelied: false,
  }),
  Object.freeze({
    artifactId: 'analytical-fact',
    artifact: 'AnalyticalFact',
    owner: 'knowledge-lake',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter.ts',
    portEvidence: 'apps/api/src/modules/knowledge-lake/domain/knowledge-lake-boundary.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Lake projection buffer emptied on restart; Reporting/AI consumers lose facts',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Projection only — extend existing Lake ports; never invent a second Lake',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'analytical-narrative',
    artifact: 'AnalyticalNarrative',
    owner: 'ai-analytics',
    persistenceToday: 'none-derived-on-read',
    storeEvidence: 'apps/api/src/modules/ai-analytics/ports/ai-analytics.port.ts',
    portEvidence: 'apps/api/src/modules/ai-analytics/ports/ai-analytics.port.ts',
    requiredDurability: 'EPHEMERAL',
    restartSurvivability: 'n/a-derived',
    currentRisk: 'Narratives regenerate from ReportRuns; lost only if ReportRuns are lost',
    futureSlice: 'honesty-baseline',
    honestyNote: 'Honest ephemeral narrative; depends on ReportRun SURVIVE for continuity',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'market-profile-version',
    artifact: 'MarketProfileVersion',
    owner: 'market-profile',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/market-profile/adapters/in-memory-market-profile-store.ts',
    portEvidence: 'apps/api/src/modules/market-profile/ports/market-profile.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Market profile version registry wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'qualification-target',
    artifact: 'QualificationTarget',
    owner: 'market-qualification',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/market-qualification/adapters/in-memory-qualification-store.ts',
    portEvidence: 'apps/api/src/modules/market-qualification/ports/market-qualification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Qualification targets disappear after restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'qualification-state',
    artifact: 'QualificationState',
    owner: 'market-qualification',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/market-qualification/adapters/in-memory-qualification-store.ts',
    portEvidence: 'apps/api/src/modules/market-qualification/ports/market-qualification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Qualification lifecycle state wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'qualification-run',
    artifact: 'QualificationRun',
    owner: 'market-qualification',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/market-qualification/adapters/in-memory-qualification-store.ts',
    portEvidence: 'apps/api/src/modules/market-qualification/ports/market-qualification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Qualification run history wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'market-confidence-health',
    artifact: 'MarketConfidenceAndHealth',
    owner: 'market-qualification',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/market-qualification/adapters/in-memory-qualification-store.ts',
    portEvidence: 'apps/api/src/modules/market-qualification/ports/market-qualification.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Confidence/health views empty after restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'market-state-projection',
    artifact: 'MarketState',
    owner: 'market-state',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/market-state/domain/market-state-projection.store.ts',
    portEvidence: 'apps/api/src/modules/market-state/ports/market-state.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Market state projection and transitions wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'exchange-scope',
    artifact: 'ExchangeScope',
    owner: 'exchange-scope',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/exchange-scope/adapters/in-memory-exchange-scope-store.ts',
    portEvidence: 'apps/api/src/modules/exchange-scope/ports/exchange-scope.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Exchange scope identity and history wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'exchange-risk-policy',
    artifact: 'ExchangeRiskPolicy',
    owner: 'exchange-scope',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/exchange-scope/adapters/in-memory-exchange-scope-store.ts',
    portEvidence: 'apps/api/src/modules/exchange-scope/ports/exchange-scope.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Risk policy version history lost on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'trading-account-binding',
    artifact: 'TradingAccountBinding',
    owner: 'exchange-scope',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/exchange-scope/adapters/in-memory-exchange-scope-store.ts',
    portEvidence: 'apps/api/src/modules/exchange-scope/ports/exchange-scope.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Account bindings lost on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'adapter-binding-context',
    artifact: 'AdapterBindingContext',
    owner: 'exchange-scope',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/exchange-scope/adapters/in-memory-exchange-scope-store.ts',
    portEvidence: 'apps/api/src/modules/exchange-scope/ports/exchange-scope.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Adapter binding context lost on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'strategy-library-records',
    artifact: 'StrategyVersionRecord',
    owner: 'strategy-library',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/strategy-library/adapters/in-memory-strategy-library-read.adapter.ts',
    portEvidence: 'apps/api/src/modules/strategy-library/domain/strategy-library-boundary.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Certified strategy membership SoT buffer is process-local',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Extend Strategy Library owner only; no second Library',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'certification-attempt',
    artifact: 'CertificationAttemptRecord',
    owner: 'strategy-library',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence:
      'apps/api/src/modules/strategy-library/adapters/in-memory-strategy-library-certification.adapter.ts',
    portEvidence: 'apps/api/src/modules/strategy-library/domain/strategy-library-boundary.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Certification attempt history wipe on restart',
    futureSlice: 'W3-O01-c',
    honestyNote: 'Must not claim restart-safe until W3-O01-b/c evidenced',
    operatorRelied: true,
  }),
  Object.freeze({
    artifactId: 'runtime-validation-record',
    artifact: 'RuntimeValidationRecord',
    owner: 'runtime-enforcement',
    persistenceToday: 'durable-owner-snapshot',
    storeEvidence: 'apps/api/src/modules/runtime-enforcement/in-memory-runtime-validation.store.ts',
    portEvidence: 'apps/api/src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
    requiredDurability: 'SURVIVE',
    restartSurvivability: 'does-not-survive-today',
    currentRisk: 'Gate decision history wipe on restart; gate compute itself remains',
    futureSlice: 'W3-O01-c',
    honestyNote: 'History survival preferred; gate authority unchanged',
    operatorRelied: true,
  }),
]);

/** Owners that must appear in the inventory (certified process-local analytical modules). */
export const W3_O01_A_REQUIRED_OWNERS: readonly W3O01AOwner[] = Object.freeze([
  ...W3_O01_A_ALLOWED_OWNERS,
]);

/** Explicit OUT of this inventory (do not silently expand without PO scope change). */
export const W3_O01_A_EXPLICIT_OUT = Object.freeze([
  'notification-durable-queue',
  'kill-switch-product',
  'monitoring-health-product',
  'outbox-redesign',
  'inbox-redesign',
  'second-knowledge-lake',
  'second-outbox',
  'live-trading',
  'research-lab-inmemory-stores',
  'wave-2-connection-record',
] as const);

export const W3_O01_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newEventStore: false,
  newKnowledgeLake: false,
  newProjectionStore: false,
  newLedger: false,
  newOutbox: false,
  newInbox: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  platformRestartSafe: false,
  customerVisibleDurability: false,
} as const);

/** Live port flags proving certified modules remain process-local today. */
export const W3_O01_A_PORT_PERSISTENCE_FLAGS = Object.freeze({
  reporting: REPORTING_PORTS_ACTIVE.persistence,
  'notification-delivery': NOTIFICATION_PORTS_ACTIVE.persistence,
  'trading-orchestrator': TRADING_ORCHESTRATOR_PORTS_ACTIVE.persistence,
  'knowledge-lake': KNOWLEDGE_LAKE_BOUNDARY.activePorts.persistence,
  'ai-analytics': AI_ANALYTICS_PORTS_ACTIVE.persistence,
  'market-profile': MARKET_PROFILE_PORTS_ACTIVE.persistence,
  'market-qualification': MARKET_QUALIFICATION_PORTS_ACTIVE.persistence,
  'market-state': MARKET_STATE_PORTS_ACTIVE.persistence,
  'exchange-scope': EXCHANGE_SCOPE_PORTS_ACTIVE.persistence,
  'strategy-library': STRATEGY_LIBRARY_BOUNDARY.activePorts.persistence,
  'runtime-enforcement': RUNTIME_ENFORCEMENT_PORTS_ACTIVE.persistence,
} as const);

export function inventoryOwners(): readonly W3O01AOwner[] {
  return [
    ...new Set(W3_O01_A_ANALYTICAL_INVENTORY.map((row) => row.owner)),
  ].sort() as W3O01AOwner[];
}

export function artifactIds(): readonly string[] {
  return W3_O01_A_ANALYTICAL_INVENTORY.map((row) => row.artifactId);
}

export function rowsRequiringSurvive(): readonly W3O01AInventoryRow[] {
  return W3_O01_A_ANALYTICAL_INVENTORY.filter((row) => row.requiredDurability === 'SURVIVE');
}

export function rowsClassifiedEphemeral(): readonly W3O01AInventoryRow[] {
  return W3_O01_A_ANALYTICAL_INVENTORY.filter((row) => row.requiredDurability === 'EPHEMERAL');
}
