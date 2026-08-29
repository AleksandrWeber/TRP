/**
 * W5-N09-b — Durable Notification Platform Workers Foundation registry.
 *
 * Maps approved W5-N09-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform workers execution.
 */

import {
  W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY,
  type W5N09AInventoryRow,
} from './w5-n09-a-notification-platform-workers-inventory';

export const W5_N09_B_SLICE_ID = 'W5-N09-b' as const;

export const W5_N09_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N09-b. */
export const W5_N09_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-workers-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N09_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-workers-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n07-dispatch-anchor',
  'own-w5-n08-queue-foundation-consume',
] as const);

export type W5N09BPersistedArtifactId = (typeof W5_N09_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N09BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N09_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N09_B_DURABLE_COVERAGE: readonly W5N09BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-workers-anchor',
    artifact: 'Canonical Notification Platform Workers anchors on Notification Delivery owner',
    owner: W5_N09_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformWorkersAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-workers-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-workers-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-workers-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829210000_w5_n09_b_notification_platform_workers_anchor/migration.sql',
  }),
]);

export const W5_N09_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'workersAnchorId',
  'platformWorkerType',
  'workersState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N09_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformWorkersImplementation: false,
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
  platformWorkersFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformWorkersFunctionalClaimed: false,
  w5N09CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformWorkersRestartSurvivalClaimed: false,
  workerExecutionImplemented: false,
  schedulerImplemented: false,
  retryOrchestrationImplemented: false,
  deadLetterProcessingImplemented: false,
} as const);

export const W5_N09_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-workers-execution',
  'worker-execution-implementation',
  'scheduler-implementation',
  'retry-orchestration',
  'dead-letter-processing',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n09-c',
] as const);

export const W5_N09_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Workers Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N09-c — Notification Platform Workers Restart Recovery Foundation',
    'W5-N09-d — Notification Platform Workers Operational Continuity Foundation',
    'W5-N09-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N09_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N09-a)',
  after: 'Durable Persistence (W5-N09-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N09-c)',
    'Operational Continuity (W5-N09-d)',
    'Package Close (W5-N09-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N09AInventoryRow[] {
  return W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.filter((row) =>
    (W5_N09_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N09AInventoryRow[] {
  return W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.filter((row) =>
    (W5_N09_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N09_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformWorkersAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-workers-persistence',
  );
  const missingRow = W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-workers-durable-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformWorkersFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformWorkersAuthorization: persisted.every(
      (row) => !row.authorizesPlatformWorkersFunctional && !row.authorizesW5N09Complete,
    ),
  });
}
