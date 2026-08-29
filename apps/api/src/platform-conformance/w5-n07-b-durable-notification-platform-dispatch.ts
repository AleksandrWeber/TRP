/**
 * W5-N07-b — Durable Notification Platform Dispatch Foundation registry.
 *
 * Maps approved W5-N07-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform dispatch execution.
 */

import {
  W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY,
  type W5N07AInventoryRow,
} from './w5-n07-a-notification-platform-dispatch-inventory';

export const W5_N07_B_SLICE_ID = 'W5-N07-b' as const;

export const W5_N07_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N07-b. */
export const W5_N07_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-dispatch-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N07_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-dispatch-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n06-delivery-anchor',
] as const);

export type W5N07BPersistedArtifactId = (typeof W5_N07_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N07BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N07_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N07_B_DURABLE_COVERAGE: readonly W5N07BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-dispatch-anchor',
    artifact: 'Canonical Notification Platform Dispatch anchors on Notification Delivery owner',
    owner: W5_N07_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformDispatchAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-dispatch-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-dispatch-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-dispatch-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829193000_w5_n07_b_notification_platform_dispatch_anchor/migration.sql',
  }),
]);

export const W5_N07_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'dispatchAnchorId',
  'platformDispatchType',
  'dispatchState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N07_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformDispatchImplementation: false,
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
  platformDispatchFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformDispatchFunctionalClaimed: false,
  w5N07CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformDispatchRestartSurvivalClaimed: false,
  dispatcherImplemented: false,
  schedulerImplemented: false,
  retryOrchestrationImplemented: false,
} as const);

export const W5_N07_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-dispatch-execution',
  'dispatcher-implementation',
  'scheduler-implementation',
  'retry-orchestration',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n07-c',
] as const);

export const W5_N07_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Notification Platform Dispatch Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N07-c — Notification Platform Dispatch Restart Recovery Foundation',
    'W5-N07-d — Notification Platform Dispatch Operational Continuity Foundation',
    'W5-N07-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N07_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N07-a)',
  after: 'Durable Persistence (W5-N07-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N07-c)',
    'Operational Continuity (W5-N07-d)',
    'Package Close (W5-N07-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N07AInventoryRow[] {
  return W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.filter((row) =>
    (W5_N07_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N07AInventoryRow[] {
  return W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.filter((row) =>
    (W5_N07_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N07_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformDispatchAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-dispatch-persistence',
  );
  const missingRow = W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-dispatch-durable-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformDispatchFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformDispatchAuthorization: persisted.every(
      (row) => !row.authorizesPlatformDispatchFunctional && !row.authorizesW5N07Complete,
    ),
  });
}
