/**
 * W4-E02-b — Durable Bybit Exchange Connectivity Foundation registry.
 *
 * Maps approved W4-E02-a SURVIVE exchange connectivity artifacts to Exchange Adapter storage.
 * Not restart recovery. Not operational continuity. Not REST/WebSocket I/O.
 */

import {
  W4_E02_A_EXCHANGE_CONNECTIVITY_INVENTORY,
  type W4E02AInventoryRow,
} from './w4-e02-a-exchange-connectivity-inventory';

export const W4_E02_B_SLICE_ID = 'W4-E02-b' as const;

export const W4_E02_B_EXCHANGE_CONNECTIVITY_OWNER = 'exchange-adapter' as const;

/** New durable persistence implemented in W4-E02-b. */
export const W4_E02_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-bybit-connection-continuity',
] as const);

/** SURVIVE rows with pre-existing persistence on their canonical owners — consumed, not duplicated. */
export const W4_E02_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-vault-ciphertext-bybit',
  'persist-connection-records-bybit',
  'persist-exchange-connections-bybit',
  'lifecycle-connection-record-bybit',
  'lifecycle-exchange-connection-model-bybit',
] as const);

export type W4E02BPersistedArtifactId = (typeof W4_E02_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W4E02BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W4_E02_B_EXCHANGE_CONNECTIVITY_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W4_E02_B_DURABLE_COVERAGE: readonly W4E02BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-bybit-connection-continuity',
    artifact: 'Bybit connection continuity durable state on Exchange Adapter owner',
    owner: W4_E02_B_EXCHANGE_CONNECTIVITY_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceBybitExchangeConnectivityState',
    repositoryPort:
      'apps/api/src/modules/exchange-adapter/domain/bybit-exchange-connectivity-state.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-bybit-exchange-connectivity-state.repository.ts',
    persistenceService:
      'apps/api/src/modules/exchange-adapter/bybit-exchange-connectivity-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260828130000_w4_e02_b_bybit_exchange_connectivity/migration.sql',
  }),
]);

export const W4_E02_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateExchangeSubsystem: false,
  duplicateConnectionOwner: false,
  engineClonePerVenue: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  w4E01Reopened: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  restImplementation: false,
  websocketImplementation: false,
  exchangeIoEstablished: false,
  customerVisibleFeature: false,
  exchangeConnectivityCompleteClaimed: false,
  bybitConnectedClaimed: false,
  exchangeConnectivityRestartSurvivalClaimed: false,
} as const);

export const W4_E02_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'rest-connectivity',
  'websocket-connectivity',
  'connection-establishment',
  'live-trading-enablement',
  'engine-clone',
  'second-persistence-owner',
  'w4-e02-c',
] as const);

export const W4_E02_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W4-E02 durable persistence foundation — workspace Bybit exchange connectivity anchors can be written to Exchange Adapter owner storage',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E02-c restart recovery — hydrate Bybit exchange connectivity anchors after API restart',
    'W4-E02-d operational continuity — Bybit exchange connectivity readiness projection',
    'W4-E02-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W4_E02_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W4-E02-a)',
  after: 'Inventory + Durable Persistence (W4-E02-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W4-E02-c)',
    'Operational Continuity (W4-E02-d)',
    'Package Close (W4-E02-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W4E02AInventoryRow[] {
  return W4_E02_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) =>
    (W4_E02_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W4E02AInventoryRow[] {
  return W4_E02_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) =>
    (W4_E02_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W4_E02_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
