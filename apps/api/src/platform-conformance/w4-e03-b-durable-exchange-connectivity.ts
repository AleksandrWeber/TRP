/**
 * W4-E03-b — Durable OKX Exchange Connectivity Foundation registry.
 *
 * Maps approved W4-E03-a SURVIVE exchange connectivity artifacts to Exchange Adapter storage.
 * Not restart recovery. Not operational continuity. Not REST/WebSocket I/O.
 */

import {
  W4_E03_A_EXCHANGE_CONNECTIVITY_INVENTORY,
  type W4E03AInventoryRow,
} from './w4-e03-a-exchange-connectivity-inventory';

export const W4_E03_B_SLICE_ID = 'W4-E03-b' as const;

export const W4_E03_B_EXCHANGE_CONNECTIVITY_OWNER = 'exchange-adapter' as const;

/** New durable persistence implemented in W4-E03-b. */
export const W4_E03_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-okx-connection-continuity',
] as const);

/** SURVIVE rows with pre-existing persistence on their canonical owners — consumed, not duplicated. */
export const W4_E03_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-vault-ciphertext-okx',
  'persist-connection-records-okx',
  'persist-exchange-connections-okx',
  'lifecycle-connection-record-okx',
  'lifecycle-exchange-connection-model-okx',
] as const);

export type W4E03BPersistedArtifactId = (typeof W4_E03_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W4E03BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W4_E03_B_EXCHANGE_CONNECTIVITY_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W4_E03_B_DURABLE_COVERAGE: readonly W4E03BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-okx-connection-continuity',
    artifact: 'OKX connection continuity durable state on Exchange Adapter owner',
    owner: W4_E03_B_EXCHANGE_CONNECTIVITY_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceOkxExchangeConnectivityState',
    repositoryPort:
      'apps/api/src/modules/exchange-adapter/domain/okx-exchange-connectivity-state.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-okx-exchange-connectivity-state.repository.ts',
    persistenceService:
      'apps/api/src/modules/exchange-adapter/okx-exchange-connectivity-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260828140000_w4_e03_b_okx_exchange_connectivity/migration.sql',
  }),
]);

export const W4_E03_B_ARCHITECTURE_CLAIMS = Object.freeze({
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
  w4E02Reopened: false,
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
  okxConnectedClaimed: false,
  exchangeConnectivityRestartSurvivalClaimed: false,
} as const);

export const W4_E03_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'rest-connectivity',
  'websocket-connectivity',
  'connection-establishment',
  'live-trading-enablement',
  'engine-clone',
  'second-persistence-owner',
  'w4-e03-c',
] as const);

export const W4_E03_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W4-E03 durable persistence foundation — workspace OKX exchange connectivity anchors can be written to Exchange Adapter owner storage',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E03-c restart recovery — hydrate OKX exchange connectivity anchors after API restart',
    'W4-E03-d operational continuity — OKX exchange connectivity readiness projection',
    'W4-E03-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W4_E03_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W4-E03-a)',
  after: 'Inventory + Durable Persistence (W4-E03-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W4-E03-c)',
    'Operational Continuity (W4-E03-d)',
    'Package Close (W4-E03-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W4E03AInventoryRow[] {
  return W4_E03_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) =>
    (W4_E03_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W4E03AInventoryRow[] {
  return W4_E03_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) =>
    (W4_E03_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W4_E03_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
