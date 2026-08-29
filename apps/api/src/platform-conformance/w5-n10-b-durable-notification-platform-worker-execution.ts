/**
 * W5-N10-b — Durable Notification Platform Worker Execution Foundation registry.
 *
 * Maps approved W5-N10-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform worker execution runtime.
 */

import {
  W5_N10_A_NOTIFICATION_PLATFORM_WORKER_EXECUTION_INVENTORY,
  type W5N10AInventoryRow,
} from './w5-n10-a-notification-platform-worker-execution-inventory';

export const W5_N10_B_SLICE_ID = 'W5-N10-b' as const;

export const W5_N10_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N10-b. */
export const W5_N10_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-worker-execution-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N10_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-worker-execution-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n07-dispatch-anchor',
  'consume-w5-n09-workers-anchor',
  'own-w5-n09-workers-foundation-consume',
] as const);

export type W5N10BPersistedArtifactId = (typeof W5_N10_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N10BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N10_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N10_B_DURABLE_COVERAGE: readonly W5N10BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-worker-execution-anchor',
    artifact:
      'Canonical Notification Platform Worker Execution anchors on Notification Delivery owner',
    owner: W5_N10_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformWorkerExecutionAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-execution-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-worker-execution-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-worker-execution-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829220000_w5_n10_b_notification_platform_worker_execution_anchor/migration.sql',
  }),
]);

export const W5_N10_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'workerExecutionAnchorId',
  'platformWorkerExecutionType',
  'workerExecutionState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N10_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformWorkerExecutionImplementation: false,
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
  platformWorkerExecutionFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformWorkerExecutionFunctionalClaimed: false,
  w5N10CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformWorkerExecutionRestartSurvivalClaimed: false,
  workerRuntimeImplemented: false,
  schedulerImplemented: false,
  retryOrchestrationImplemented: false,
  deadLetterProcessingImplemented: false,
} as const);

export const W5_N10_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-worker-execution-runtime',
  'worker-runtime-implementation',
  'scheduler-implementation',
  'retry-orchestration',
  'dead-letter-processing',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n10-c',
] as const);

export const W5_N10_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Worker Execution Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N10-c — Notification Platform Worker Execution Restart Recovery Foundation',
    'W5-N10-d — Notification Platform Worker Execution Operational Continuity Foundation',
    'W5-N10-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N10_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N10-a)',
  after: 'Durable Persistence (W5-N10-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N10-c)',
    'Operational Continuity (W5-N10-d)',
    'Package Close (W5-N10-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N10AInventoryRow[] {
  return W5_N10_A_NOTIFICATION_PLATFORM_WORKER_EXECUTION_INVENTORY.filter((row) =>
    (W5_N10_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N10AInventoryRow[] {
  return W5_N10_A_NOTIFICATION_PLATFORM_WORKER_EXECUTION_INVENTORY.filter((row) =>
    (W5_N10_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N10_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformWorkerExecutionAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N10_A_NOTIFICATION_PLATFORM_WORKER_EXECUTION_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-worker-execution-persistence',
  );
  const missingRow = W5_N10_A_NOTIFICATION_PLATFORM_WORKER_EXECUTION_INVENTORY.find(
    (row) => row.artifactId === 'missing-worker-execution-durable-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformWorkerExecutionFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformWorkerExecutionAuthorization: persisted.every(
      (row) => !row.authorizesPlatformWorkerExecutionFunctional && !row.authorizesW5N10Complete,
    ),
  });
}
