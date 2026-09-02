/**
 * W5-N12-b — Durable Notification Platform Scheduler Foundation registry.
 *
 * Maps approved W5-N12-a inventory to Notification Delivery anchor storage.
 * W5-N12-c adds restart recovery hydrate and persistence write-through — not operational continuity.
 */

import {
  W5_N12_A_NOTIFICATION_PLATFORM_SCHEDULER_INVENTORY,
  type W5N12AInventoryRow,
} from './w5-n12-a-notification-platform-scheduler-inventory';

export const W5_N12_B_SLICE_ID = 'W5-N12-b' as const;

export const W5_N12_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N12-b. */
export const W5_N12_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-scheduler-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N12_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-scheduler-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n11-worker-runtime-anchor',
  'consume-w5-n11-worker-runtime-persistence',
  'own-w5-n11-worker-runtime-foundation-consume',
] as const);

export type W5N12BPersistedArtifactId = (typeof W5_N12_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N12BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N12_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N12_B_DURABLE_COVERAGE: readonly W5N12BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-scheduler-anchor',
    artifact: 'Canonical Notification Platform Scheduler anchors on Notification Delivery owner',
    owner: W5_N12_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformSchedulerAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-scheduler-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-scheduler-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-scheduler-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902150000_w5_n12_b_notification_platform_scheduler_anchor/migration.sql',
  }),
]);

export const W5_N12_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'schedulerAnchorId',
  'platformSchedulerType',
  'schedulerState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N12_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformSchedulerImplementation: false,
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
  platformSchedulerFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformSchedulerFunctionalClaimed: false,
  w5N12CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformSchedulerRestartSurvivalClaimed: false,
  schedulerRuntimeImplemented: false,
  schedulingEngineImplemented: false,
  schedulerExecutionImplemented: false,
  retryOrchestrationImplemented: false,
  deadLetterProcessingImplemented: false,
} as const);

export const W5_N12_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-scheduler-runtime',
  'scheduler-runtime-implementation',
  'scheduling-engine-implementation',
  'scheduler-execution-implementation',
  'retry-orchestration',
  'dead-letter-processing',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N12_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Scheduler Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N12-d — Notification Platform Scheduler Operational Continuity Foundation',
    'W5-N12-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N12_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N12-a)',
  after: 'Durable Persistence (W5-N12-b)',
  stillMissing: Object.freeze([
    'Operational Continuity (W5-N12-d)',
    'Package Close (W5-N12-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N12AInventoryRow[] {
  return W5_N12_A_NOTIFICATION_PLATFORM_SCHEDULER_INVENTORY.filter((row) =>
    (W5_N12_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N12AInventoryRow[] {
  return W5_N12_A_NOTIFICATION_PLATFORM_SCHEDULER_INVENTORY.filter((row) =>
    (W5_N12_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N12_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformSchedulerAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N12_A_NOTIFICATION_PLATFORM_SCHEDULER_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-scheduler-persistence',
  );
  const missingRow = W5_N12_A_NOTIFICATION_PLATFORM_SCHEDULER_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-scheduler-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformSchedulerFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformSchedulerAuthorization: persisted.every(
      (row) => !row.authorizesPlatformSchedulerFunctional && !row.authorizesW5N12Complete,
    ),
  });
}
