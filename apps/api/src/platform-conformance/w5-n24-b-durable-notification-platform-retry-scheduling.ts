/**
 * W5-N24-b — Durable Notification Platform Retry Scheduling Foundation registry.
 *
 * Maps approved W5-N24-a inventory to Notification Delivery scheduling anchor storage.
 * Consumes Closed W5-N19-b durable scheduling persistence substrate — does not duplicate it.
 * Storage only — not runtime scheduling, not Retry Backoff Calculation, not Retry Eligibility,
 * not retry execution. Restart recovery is W5-N24-c — not implemented here.
 */

import {
  W5_N24_A_RETRY_SCHEDULING_INVENTORY,
  type W5N24AInventoryRow,
} from './w5-n24-a-retry-scheduling-inventory';

export const W5_N24_B_SLICE_ID = 'W5-N24-b' as const;

export const W5_N24_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence coverage synchronized in W5-N24-b (reuses W5-N19-b stack). */
export const W5_N24_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-candidate-scheduling-anchor',
] as const);

/**
 * RECOVERABLE rows with pre-existing / consumed foundations — not duplicated by this slice.
 * All RECOVERABLE inventory rows except the new persist candidate.
 */
export const W5_N24_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS = Object.freeze([
  'own-platform-scheduling-layer',
  'own-notification-delivery-domain',
  'own-pc06-routing-delivery',
  'own-w5-n17-delivery-reliability-consume',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n19-retry-scheduling-consume',
  'own-w5-n20-retry-policy-consume',
  'own-w5-n21-retry-backoff-consume',
  'own-w5-n22-retry-backoff-calculation-consume',
  'own-w5-n23-retry-eligibility-consume',
  'own-notification-durable-queue',
  'consume-w5-n17-delivery-reliability-anchor',
  'consume-w5-n18-retry-execution-anchor',
  'consume-w5-n19-retry-scheduling-anchor',
  'consume-w5-n20-retry-policy-anchor',
  'consume-w5-n21-retry-backoff-anchor',
  'consume-w5-n22-retry-backoff-calculation-anchor',
  'consume-w5-n22-retry-backoff-calculation-restart-recovery',
  'consume-w5-n22-retry-backoff-calculation-continuity',
  'consume-w5-n23-retry-eligibility-anchor',
  'consume-w5-n23-retry-eligibility-persistence',
  'consume-w5-n23-retry-eligibility-restart-recovery',
  'consume-w5-n23-retry-eligibility-continuity',
  'runtime-pc06-resolve-delivery-routing',
  'state-n22-backoff-calculation-anchor-reference',
  'dep-w5-n22-inventory-reference',
  'missing-scheduling-persistence',
] as const);

export type W5N24BPersistedArtifactId = (typeof W5_N24_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N24BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N24_B_NOTIFICATION_OWNER;
  classification: 'RECOVERABLE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
  consumedFrom: 'W5-N19-b';
}>;

export const W5_N24_B_DURABLE_COVERAGE: readonly W5N24BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-candidate-scheduling-anchor',
    artifact:
      'Canonical Notification Platform Retry Scheduling anchors on Notification Delivery owner',
    owner: W5_N24_B_NOTIFICATION_OWNER,
    classification: 'RECOVERABLE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetrySchedulingAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-scheduling-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260910210000_w5_n19_b_notification_platform_retry_scheduling_anchor/migration.sql',
    consumedFrom: 'W5-N19-b' as const,
  }),
]);

export const W5_N24_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'retrySchedulingAnchorId',
  'platformRetrySchedulingType',
  'retrySchedulingState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N24_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateSchedulingSubsystem: false,
  duplicateRetrySubsystem: false,
  duplicateRoutingEngine: false,
  schedulerEngineIntroduced: false,
  runtimeSchedulerIntroduced: false,
  retryEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  workerIntroduced: false,
  timerImplementationIntroduced: false,
  runtimeSchedulingImplemented: false,
  schedulingFunctional: false,
  backoffCalculationImplemented: false,
  eligibilityDeterminationImplemented: false,
  executionImplemented: false,
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
  productionTransportIo: false,
  customerVisibleFeature: false,
  schedulingFunctionalClaimed: false,
  w5N24CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  schedulingRestartSurvivalClaimed: false,
  restartRecoveryImplemented: false,
  n19SchedulingPersistenceConsumed: true,
  newSchedulingPersistenceStackIntroduced: false,
} as const);

export const W5_N24_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'runtime-scheduling',
  'backoff-calculation',
  'retry-eligibility-determination',
  'retry-execution',
  'retry-lifecycle',
  'timers',
  'workers',
  'orchestration',
  'scheduler-engine',
  'runtime-scheduler',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'duplicate-scheduling-storage',
  'retry-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus',
] as const);

export const W5_N24_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'Durable persistence foundation for Notification Retry Scheduling artifacts',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N24-c — Restart Recovery Foundation',
    'W5-N24-d — Operational Continuity Foundation',
    'W5-N24-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N24_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N24-a)',
  after: 'Durable Persistence (W5-N24-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N24-c)',
    'Operational continuity (W5-N24-d)',
    'Package Close evidence (W5-N24-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N24AInventoryRow[] {
  return W5_N24_A_RETRY_SCHEDULING_INVENTORY.filter((row) =>
    (W5_N24_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingRecoverableInventoryRows(): readonly W5N24AInventoryRow[] {
  return W5_N24_A_RETRY_SCHEDULING_INVENTORY.filter((row) =>
    (W5_N24_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N24_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowRecoverable: boolean;
  ownershipRowRecoverable: boolean;
  noSchedulingAuthorization: boolean;
  persistenceGapResolved: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N24_A_RETRY_SCHEDULING_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-scheduling-layer',
  );
  const persistenceGap = W5_N24_A_RETRY_SCHEDULING_INVENTORY.find(
    (row) => row.artifactId === 'missing-scheduling-persistence',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.classification === 'RECOVERABLE' &&
      persisted[0]?.existsToday === true &&
      ownership?.classification === 'RECOVERABLE' &&
      persistenceGap?.existsToday === true &&
      persisted.every((row) => !row.authorizesSchedulingFunctional),
    persistedRowRecoverable: persisted[0]?.classification === 'RECOVERABLE',
    ownershipRowRecoverable: ownership?.classification === 'RECOVERABLE',
    noSchedulingAuthorization: persisted.every(
      (row) => !row.authorizesSchedulingFunctional && !row.authorizesW5N24Complete,
    ),
    persistenceGapResolved: persistenceGap?.existsToday === true,
  });
}
