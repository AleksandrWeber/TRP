/**
 * W4-E05-b — Durable Venue Permission Verification Foundation registry.
 *
 * Maps approved W4-E05-a SURVIVE venue permission artifacts to Exchange Adapter storage.
 * Not restart recovery. Not operational continuity. Not vendor permission probe I/O.
 */

import {
  W4_E05_A_VENUE_PERMISSION_INVENTORY,
  type W4E05AInventoryRow,
} from './w4-e05-a-venue-permission-inventory';

export const W4_E05_B_SLICE_ID = 'W4-E05-b' as const;

export const W4_E05_B_VENUE_PERMISSION_OWNER = 'exchange-adapter' as const;

/** New durable persistence implemented in W4-E05-b. */
export const W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-vendor-permission-verification',
] as const);

/** SURVIVE rows with pre-existing persistence on their canonical owners — consumed, not duplicated. */
export const W4_E05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-exchange-connections-api-permissions',
  'persist-vault-credentials-for-permission-probe',
] as const);

export type W4E05BPersistedArtifactId = (typeof W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W4E05BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W4_E05_B_VENUE_PERMISSION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W4_E05_B_DURABLE_COVERAGE: readonly W4E05BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-vendor-permission-verification',
    artifact: 'Durable venue permission verification anchors on Exchange Adapter owner',
    owner: W4_E05_B_VENUE_PERMISSION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceVenuePermissionVerificationState',
    repositoryPort:
      'apps/api/src/modules/exchange-adapter/domain/venue-permission-verification-state.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-venue-permission-verification-state.repository.ts',
    persistenceService:
      'apps/api/src/modules/exchange-adapter/venue-permission-verification-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829100000_w4_e05_b_venue_permission_verification/migration.sql',
  }),
]);

export const W4_E05_B_CANONICAL_ANCHORS = Object.freeze([
  'workspaceId',
  'exchangeIdentifier',
  'connectionId',
  'adapterExchangeConnectionId',
  'permissionVerificationId',
  'vendorPermissionHash',
  'integrityMetadataHash',
  'correlationId',
] as const);

export const W4_E05_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateExchangeSubsystem: false,
  duplicatePermissionSubsystem: false,
  engineClonePerVenue: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  w4E01Reopened: false,
  w4E02Reopened: false,
  w4E03Reopened: false,
  w4E04Reopened: false,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  vendorPermissionProbeIo: false,
  runtimePermissionCachePersisted: false,
  customerVisibleFeature: false,
  venuePermissionVerificationCompleteClaimed: false,
  venuePermissionVerificationRestartSurvivalClaimed: false,
} as const);

export const W4_E05_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'recovery-store',
  'runtime-permission-cache',
  'vendor-permission-probe-io',
  'live-trading-enablement',
  'engine-clone',
  'second-persistence-owner',
  'w4-e05-c',
] as const);

export const W4_E05_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W4-E05 Durable Venue Permission Verification Foundation — canonical permission verification anchors can be written to Exchange Adapter owner storage',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E05-c restart recovery — hydrate venue permission verification anchors after API restart',
    'W4-E05-d operational continuity — venue permission readiness projection',
    'W4-E05-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W4_E05_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W4-E05-a)',
  after: 'Inventory + Durable Persistence (W4-E05-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W4-E05-c)',
    'Operational Continuity (W4-E05-d)',
    'Package Close (W4-E05-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W4E05AInventoryRow[] {
  return W4_E05_A_VENUE_PERMISSION_INVENTORY.filter((row) =>
    (W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W4E05AInventoryRow[] {
  return W4_E05_A_VENUE_PERMISSION_INVENTORY.filter((row) =>
    (W4_E05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W4_E05_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
