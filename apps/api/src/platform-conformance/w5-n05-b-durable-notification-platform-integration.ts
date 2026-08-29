/**
 * W5-N05-b — Durable Notification Platform Integration Foundation registry.
 *
 * Maps approved W5-N05-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform integration I/O.
 */

import {
  W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY,
  type W5N05AInventoryRow,
} from './w5-n05-a-notification-platform-integration-inventory';

export const W5_N05_B_SLICE_ID = 'W5-N05-b' as const;

export const W5_N05_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N05-b. */
export const W5_N05_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-integration-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-integration-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-integration',
  'own-per-channel-foundations-reference',
] as const);

export type W5N05BPersistedArtifactId = (typeof W5_N05_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N05BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N05_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N05_B_DURABLE_COVERAGE: readonly W5N05BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-integration-anchor',
    artifact: 'Canonical Notification Platform Integration anchors on Notification Delivery owner',
    owner: W5_N05_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformIntegrationAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-integration-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-integration-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-integration-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829180000_w5_n05_b_notification_platform_integration_anchor/migration.sql',
  }),
]);

export const W5_N05_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'integrationAnchorId',
  'platformIntegrationType',
  'integrationState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N05_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformIntegrationImplementation: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  exchangeAdapterUntouched: true,
  connectionManagementUntouched: true,
  secretVaultUntouched: true,
  workspaceOwnershipUntouched: true,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  platformIntegrationFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformIntegrationFunctionalClaimed: false,
  w5N05CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformIntegrationRestartSurvivalClaimed: false,
} as const);

export const W5_N05_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-integration-i/o',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n05-c',
] as const);

export const W5_N05_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Notification Platform Integration Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N05-c — Notification Platform Restart Recovery Integration Foundation',
    'W5-N05-d — Notification Platform Operational Continuity Integration Foundation',
    'W5-N05-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N05_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N05-a)',
  after: 'Durable Persistence (W5-N05-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N05-c)',
    'Operational Continuity (W5-N05-d)',
    'Package Close (W5-N05-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter((row) =>
    (W5_N05_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter((row) =>
    (W5_N05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N05_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformIntegrationAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-integration-persistence',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      persisted.every((row) => !row.authorizesPlatformIntegrationFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformIntegrationAuthorization: persisted.every(
      (row) => !row.authorizesPlatformIntegrationFunctional && !row.authorizesW5N05Complete,
    ),
  });
}
