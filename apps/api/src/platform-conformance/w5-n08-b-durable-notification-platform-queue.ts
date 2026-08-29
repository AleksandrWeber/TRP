/**
 * W5-N08-b — Durable Notification Platform Queue Foundation registry.
 *
 * Maps approved W5-N08-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform queue execution.
 */

import {
  W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY,
  type W5N08AInventoryRow,
} from './w5-n08-a-notification-platform-queue-inventory';

export const W5_N08_B_SLICE_ID = 'W5-N08-b' as const;

export const W5_N08_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N08-b. */
export const W5_N08_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-queue-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N08_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-queue-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n07-dispatch-anchor',
] as const);

export type W5N08BPersistedArtifactId = (typeof W5_N08_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N08BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N08_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N08_B_DURABLE_COVERAGE: readonly W5N08BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-queue-anchor',
    artifact: 'Canonical Notification Platform Queue anchors on Notification Delivery owner',
    owner: W5_N08_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformQueueAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-queue-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-queue-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-queue-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829200000_w5_n08_b_notification_platform_queue_anchor/migration.sql',
  }),
]);

export const W5_N08_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'queueAnchorId',
  'platformQueueType',
  'queueState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N08_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformQueueImplementation: false,
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
  platformQueueFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformQueueFunctionalClaimed: false,
  w5N08CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformQueueRestartSurvivalClaimed: false,
  queueWorkersImplemented: false,
  schedulerImplemented: false,
  retryOrchestrationImplemented: false,
  dispatcherImplemented: false,
} as const);

export const W5_N08_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-queue-execution',
  'queue-workers-implementation',
  'scheduler-implementation',
  'retry-orchestration',
  'dispatcher-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n08-c',
] as const);

export const W5_N08_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Queue Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N08-c — Notification Platform Queue Restart Recovery Foundation',
    'W5-N08-d — Notification Platform Queue Operational Continuity Foundation',
    'W5-N08-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N08_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N08-a)',
  after: 'Durable Persistence (W5-N08-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N08-c)',
    'Operational Continuity (W5-N08-d)',
    'Package Close (W5-N08-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N08AInventoryRow[] {
  return W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY.filter((row) =>
    (W5_N08_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N08AInventoryRow[] {
  return W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY.filter((row) =>
    (W5_N08_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N08_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformQueueAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-queue-persistence',
  );
  const missingRow = W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-queue-durable-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformQueueFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformQueueAuthorization: persisted.every(
      (row) => !row.authorizesPlatformQueueFunctional && !row.authorizesW5N08Complete,
    ),
  });
}
