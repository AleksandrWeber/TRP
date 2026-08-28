/**
 * W4-E04-b — Durable Kraken Exchange Connectivity Foundation registry.
 *
 * Maps approved W4-E04-a SURVIVE exchange connectivity artifacts to Exchange Adapter storage.
 * Not restart recovery. Not operational continuity. Not REST/WebSocket I/O.
 */

import {
  W4_E04_A_EXCHANGE_CONNECTIVITY_INVENTORY,
  type W4E04AInventoryRow,
} from './w4-e04-a-exchange-connectivity-inventory';

export const W4_E04_B_SLICE_ID = 'W4-E04-b' as const;

export const W4_E04_B_EXCHANGE_CONNECTIVITY_OWNER = 'exchange-adapter' as const;

/** New durable persistence implemented in W4-E04-b. */
export const W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-kraken-connection-continuity',
] as const);

/** SURVIVE rows with pre-existing persistence on their canonical owners — consumed, not duplicated. */
export const W4_E04_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-vault-ciphertext-kraken',
  'persist-connection-records-kraken',
  'persist-exchange-connections-kraken',
  'lifecycle-connection-record-kraken',
  'lifecycle-exchange-connection-model-kraken',
] as const);

export type W4E04BPersistedArtifactId = (typeof W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W4E04BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W4_E04_B_EXCHANGE_CONNECTIVITY_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W4_E04_B_DURABLE_COVERAGE: readonly W4E04BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-kraken-connection-continuity',
    artifact: 'Kraken connection continuity durable state on Exchange Adapter owner',
    owner: W4_E04_B_EXCHANGE_CONNECTIVITY_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceKrakenExchangeConnectivityState',
    repositoryPort:
      'apps/api/src/modules/exchange-adapter/domain/kraken-exchange-connectivity-state.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-kraken-exchange-connectivity-state.repository.ts',
    persistenceService:
      'apps/api/src/modules/exchange-adapter/kraken-exchange-connectivity-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260828160000_w4_e04_b_kraken_exchange_connectivity/migration.sql',
  }),
]);

export const W4_E04_B_ARCHITECTURE_CLAIMS = Object.freeze({
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
  w4E03Reopened: false,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  restImplementation: false,
  websocketImplementation: false,
  exchangeIoEstablished: false,
  customerVisibleFeature: false,
  exchangeConnectivityCompleteClaimed: false,
  krakenConnectedClaimed: false,
  exchangeConnectivityRestartSurvivalClaimed: false,
} as const);

export const W4_E04_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'rest-connectivity',
  'websocket-connectivity',
  'connection-establishment',
  'live-trading-enablement',
  'engine-clone',
  'second-persistence-owner',
  'w4-e04-c',
] as const);

export const W4_E04_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W4-E04 durable persistence foundation — workspace Kraken exchange connectivity anchors can be written to Exchange Adapter owner storage',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E04-c restart recovery — hydrate Kraken exchange connectivity anchors after API restart',
    'W4-E04-d operational continuity — Kraken exchange connectivity readiness projection',
    'W4-E04-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W4_E04_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W4-E04-a)',
  after: 'Inventory + Durable Persistence (W4-E04-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W4-E04-c)',
    'Operational Continuity (W4-E04-d)',
    'Package Close (W4-E04-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W4E04AInventoryRow[] {
  return W4_E04_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) =>
    (W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W4E04AInventoryRow[] {
  return W4_E04_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) =>
    (W4_E04_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W4_E04_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
