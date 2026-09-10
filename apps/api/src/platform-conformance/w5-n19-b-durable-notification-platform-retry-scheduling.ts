/**
 * W5-N19-b — Durable Notification Platform Retry Scheduling Foundation registry.
 *
 * Maps approved W5-N19-a inventory to Notification Delivery anchor storage.
 * W5-N19-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N19_A_RETRY_SCHEDULING_INVENTORY,
  type W5N19AInventoryRow,
} from './w5-n19-a-retry-scheduling-inventory';

export const W5_N19_B_SLICE_ID = 'W5-N19-b' as const;

export const W5_N19_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N19-b. */
export const W5_N19_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-retry-scheduling-anchor',
] as const);

/** SURVIVE / DURABLE+RECOVERABLE rows with pre-existing persistence — consumed, not duplicated. */
export const W5_N19_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-retry-scheduling-layer',
  'own-notification-delivery-domain',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n12-scheduler-foundation-consume',
  'own-w5-n13-retry-foundation-consume',
  'own-w5-n17-delivery-reliability-consume',
  'channel-w5-n01-telegram-anchor',
  'channel-w5-n02-email-anchor',
  'channel-w5-n03-webhook-anchor',
  'channel-w5-n04-push-anchor',
  'consume-w5-n18-retry-execution-anchor',
  'consume-w5-n18-retry-execution-restart-recovery',
  'consume-w5-n18-retry-execution-continuity',
  'consume-w5-n12-scheduler-foundation',
  'consume-w5-n13-retry-anchor',
  'consume-w5-n17-reliability-anchor',
  'runtime-pc06-resolve-delivery-routing',
] as const);

export type W5N19BPersistedArtifactId = (typeof W5_N19_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N19BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N19_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N19_B_DURABLE_COVERAGE: readonly W5N19BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-retry-scheduling-anchor',
    artifact:
      'Canonical Notification Platform Retry Scheduling anchors on Notification Delivery owner',
    owner: W5_N19_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetrySchedulingAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-scheduling-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260910210000_w5_n19_b_notification_platform_retry_scheduling_anchor/migration.sql',
  }),
]);

export const W5_N19_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'retrySchedulingAnchorId',
  'platformRetrySchedulingType',
  'retrySchedulingState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N19_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateSchedulerSubsystem: false,
  duplicateRoutingEngine: false,
  schedulerPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  retrySchedulingImplementation: false,
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
  retrySchedulingFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  retrySchedulingFunctionalClaimed: false,
  w5N19CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  retrySchedulingRestartSurvivalClaimed: false,
  retryTimingCalculationImplemented: false,
  retrySchedulingRuntimeImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N19_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'retry-scheduling-runtime',
  'retry-scheduling-implementation',
  'retry-timing-calculation',
  'backoff-algorithms',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'scheduler-platform',
  'workflow-engine',
  'event-bus-product',
  'retry-platform',
] as const);

export const W5_N19_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Retry Scheduling persistence foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N19-c — Restart Recovery Foundation',
    'W5-N19-d — Operational Continuity Foundation',
    'W5-N19-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N19_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N19-a)',
  after: 'Durable Persistence (W5-N19-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N19-c)',
    'Operational continuity (W5-N19-d)',
    'Package Close evidence (W5-N19-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N19AInventoryRow[] {
  return W5_N19_A_RETRY_SCHEDULING_INVENTORY.filter((row) =>
    (W5_N19_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N19AInventoryRow[] {
  return W5_N19_A_RETRY_SCHEDULING_INVENTORY.filter((row) =>
    (W5_N19_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N19_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noRetrySchedulingAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N19_A_RETRY_SCHEDULING_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-retry-scheduling-layer',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      persisted.every((row) => !row.authorizesRetrySchedulingFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noRetrySchedulingAuthorization: persisted.every(
      (row) => !row.authorizesRetrySchedulingFunctional && !row.authorizesW5N19Complete,
    ),
  });
}
