/**
 * W5-N11-b — Durable Notification Platform Worker Runtime Foundation registry.
 *
 * Maps approved W5-N11-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not platform worker runtime execution.
 */

import {
  W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY,
  type W5N11AInventoryRow,
} from './w5-n11-a-notification-platform-worker-runtime-inventory';

export const W5_N11_B_SLICE_ID = 'W5-N11-b' as const;

export const W5_N11_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N11-b. */
export const W5_N11_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-worker-runtime-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N11_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-worker-runtime-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n10-worker-execution-anchor',
  'consume-w5-n10-worker-execution-persistence',
  'own-w5-n10-worker-execution-foundation-consume',
] as const);

export type W5N11BPersistedArtifactId = (typeof W5_N11_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N11BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N11_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N11_B_DURABLE_COVERAGE: readonly W5N11BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-worker-runtime-anchor',
    artifact:
      'Canonical Notification Platform Worker Runtime anchors on Notification Delivery owner',
    owner: W5_N11_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformWorkerRuntimeAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-runtime-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-worker-runtime-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-worker-runtime-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902140000_w5_n11_b_notification_platform_worker_runtime_anchor/migration.sql',
  }),
]);

export const W5_N11_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'workerRuntimeAnchorId',
  'platformWorkerRuntimeType',
  'workerRuntimeState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N11_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformWorkerRuntimeImplementation: false,
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
  platformWorkerRuntimeFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformWorkerRuntimeFunctionalClaimed: false,
  w5N11CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformWorkerRuntimeRestartSurvivalClaimed: false,
  workerRuntimeExecutionImplemented: false,
  schedulerImplemented: false,
  retryOrchestrationImplemented: false,
  deadLetterProcessingImplemented: false,
} as const);

export const W5_N11_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-worker-runtime-execution',
  'worker-runtime-execution-implementation',
  'scheduler-implementation',
  'retry-orchestration',
  'dead-letter-processing',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N11_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Worker Runtime Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N11-c — Notification Platform Worker Runtime Restart Recovery Foundation',
    'W5-N11-d — Notification Platform Worker Runtime Operational Continuity Foundation',
    'W5-N11-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N11_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N11-a)',
  after: 'Durable Persistence (W5-N11-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N11-c)',
    'Operational Continuity (W5-N11-d)',
    'Package Close (W5-N11-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N11AInventoryRow[] {
  return W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.filter((row) =>
    (W5_N11_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N11AInventoryRow[] {
  return W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.filter((row) =>
    (W5_N11_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N11_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformWorkerRuntimeAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-worker-runtime-persistence',
  );
  const missingRow = W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-worker-runtime-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformWorkerRuntimeFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformWorkerRuntimeAuthorization: persisted.every(
      (row) => !row.authorizesPlatformWorkerRuntimeFunctional && !row.authorizesW5N11Complete,
    ),
  });
}
