/**
 * W3-O01-b — Durable Persistence Foundation registry.
 *
 * Maps approved W3-O01-a SURVIVE artifacts to existing-owner durable stores.
 * Not a persistence product / new bounded context / recovery engine.
 */

import { W3_O01_A_ANALYTICAL_INVENTORY, type W3O01AOwner } from './w3-o01-a-analytical-inventory';
import {
  W3_O01_B_DURABLE_OWNERS,
  type W3O01BDurableOwner,
} from '../persistence/analytical-owner-store-snapshot';

export const W3_O01_B_SLICE_ID = 'W3-O01-b' as const;

export type W3O01BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: W3O01BDurableOwner;
  durableAdapter: string;
  storeToken: string;
}>;

/** SURVIVE inventory rows covered by owner-scoped durable snapshots. */
export const W3_O01_B_DURABLE_COVERAGE: readonly W3O01BDurableCoverage[] = Object.freeze(
  W3_O01_A_ANALYTICAL_INVENTORY.filter(
    (row) =>
      row.requiredDurability === 'SURVIVE' &&
      (W3_O01_B_DURABLE_OWNERS as readonly string[]).includes(row.owner),
  ).map((row) =>
    Object.freeze({
      artifactId: row.artifactId,
      artifact: row.artifact,
      owner: row.owner as W3O01BDurableOwner,
      durableAdapter: durableAdapterForOwner(row.owner as W3O01BDurableOwner),
      storeToken: storeTokenForOwner(row.owner as W3O01BDurableOwner),
    }),
  ),
);

export const W3_O01_B_ARCHITECTURE_CLAIMS = Object.freeze({
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
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  customerVisibleDurabilityUi: false,
} as const);

export const W3_O01_B_EPHEMERAL_EXCLUDED = Object.freeze([
  'orchestrator-market-state-seed-buffer',
  'analytical-narrative',
] as const);

function durableAdapterForOwner(owner: W3O01BDurableOwner): string {
  switch (owner) {
    case 'reporting':
      return 'apps/api/src/modules/reporting/adapters/durable-reporting-store.ts';
    case 'notification-delivery':
      return 'apps/api/src/modules/notification-delivery/adapters/durable-notification-store.ts';
    case 'trading-orchestrator':
      return 'apps/api/src/modules/trading-orchestrator/adapters/durable-orchestration-coordination.store.ts';
    case 'knowledge-lake':
      return 'apps/api/src/modules/knowledge-lake/ingestion/durable-knowledge-lake-ingestion.adapter.ts';
    case 'market-profile':
      return 'apps/api/src/modules/market-profile/adapters/durable-market-profile-store.ts';
    case 'market-qualification':
      return 'apps/api/src/modules/market-qualification/adapters/durable-qualification-store.ts';
    case 'market-state':
      return 'apps/api/src/modules/market-state/adapters/durable-market-state-projection.store.ts';
    case 'exchange-scope':
      return 'apps/api/src/modules/exchange-scope/adapters/durable-exchange-scope-store.ts';
    case 'strategy-library':
      return 'apps/api/src/modules/strategy-library/adapters/durable-strategy-library-read.adapter.ts';
    case 'runtime-enforcement':
      return 'apps/api/src/modules/runtime-enforcement/durable-runtime-validation.store.ts';
    default: {
      const _exhaustive: never = owner;
      return _exhaustive;
    }
  }
}

function storeTokenForOwner(owner: W3O01BDurableOwner): string {
  switch (owner) {
    case 'reporting':
      return 'InMemoryReportingStore';
    case 'notification-delivery':
      return 'InMemoryNotificationStore';
    case 'trading-orchestrator':
      return 'OrchestrationCoordinationStore';
    case 'knowledge-lake':
      return 'InMemoryKnowledgeLakeIngestionAdapter';
    case 'market-profile':
      return 'InMemoryMarketProfileStore';
    case 'market-qualification':
      return 'InMemoryQualificationStore';
    case 'market-state':
      return 'MarketStateProjectionStore';
    case 'exchange-scope':
      return 'InMemoryExchangeScopeStore';
    case 'strategy-library':
      return 'InMemoryStrategyLibraryReadAdapter';
    case 'runtime-enforcement':
      return 'InMemoryRuntimeValidationStore';
    default: {
      const _exhaustive: never = owner;
      return _exhaustive;
    }
  }
}

export function durableOwnersCovered(): readonly W3O01BDurableOwner[] {
  return [
    ...new Set(W3_O01_B_DURABLE_COVERAGE.map((row) => row.owner)),
  ].sort() as W3O01BDurableOwner[];
}

export function isDurableOwner(owner: W3O01AOwner): owner is W3O01BDurableOwner {
  return (W3_O01_B_DURABLE_OWNERS as readonly string[]).includes(owner);
}
