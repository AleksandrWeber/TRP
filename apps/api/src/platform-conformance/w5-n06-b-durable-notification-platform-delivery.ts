/**
 * W5-N06-b — Durable Notification Platform Delivery Foundation registry.
 *
 * Maps approved W5-N06-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform delivery execution.
 */

import {
  W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY,
  type W5N06AInventoryRow,
} from './w5-n06-a-notification-platform-delivery-inventory';

export const W5_N06_B_SLICE_ID = 'W5-N06-b' as const;

export const W5_N06_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N06-b. */
export const W5_N06_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-delivery-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N06_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-delivery-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
] as const);

export type W5N06BPersistedArtifactId = (typeof W5_N06_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N06BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N06_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N06_B_DURABLE_COVERAGE: readonly W5N06BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-delivery-anchor',
    artifact: 'Canonical Notification Platform Delivery anchors on Notification Delivery owner',
    owner: W5_N06_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformDeliveryAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-delivery-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-delivery-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-delivery-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829190000_w5_n06_b_notification_platform_delivery_anchor/migration.sql',
  }),
]);

export const W5_N06_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'deliveryAnchorId',
  'platformDeliveryType',
  'deliveryState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N06_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformDeliveryImplementation: false,
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
  platformDeliveryFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformDeliveryFunctionalClaimed: false,
  w5N06CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformDeliveryRestartSurvivalClaimed: false,
  dispatcherImplemented: false,
  schedulerImplemented: false,
  retryOrchestrationImplemented: false,
} as const);

export const W5_N06_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-delivery-execution',
  'dispatcher-implementation',
  'scheduler-implementation',
  'retry-orchestration',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n06-c',
] as const);

export const W5_N06_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Notification Platform Delivery Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N06-c — Notification Platform Delivery Restart Recovery Foundation',
    'W5-N06-d — Notification Platform Delivery Operational Continuity Foundation',
    'W5-N06-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N06_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N06-a)',
  after: 'Durable Persistence (W5-N06-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N06-c)',
    'Operational Continuity (W5-N06-d)',
    'Package Close (W5-N06-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N06AInventoryRow[] {
  return W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.filter((row) =>
    (W5_N06_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N06AInventoryRow[] {
  return W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.filter((row) =>
    (W5_N06_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N06_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformDeliveryAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-delivery-persistence',
  );
  const missingRow = W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-delivery-durable-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformDeliveryFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformDeliveryAuthorization: persisted.every(
      (row) => !row.authorizesPlatformDeliveryFunctional && !row.authorizesW5N06Complete,
    ),
  });
}
