/**
 * W5-N22-b — Durable Notification Platform Retry Backoff Calculation Foundation registry.
 *
 * Maps approved W5-N22-a inventory to Notification Delivery calculation anchor storage.
 * W5-N22-c adds restart recovery hydrate — not operational continuity.
 * Storage only — not calculation runtime, not scheduling, not execution.
 */

import {
  W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY,
  type W5N22AInventoryRow,
} from './w5-n22-a-retry-backoff-calculation-inventory';

export const W5_N22_B_SLICE_ID = 'W5-N22-b' as const;

export const W5_N22_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N22-b. */
export const W5_N22_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-candidate-backoff-calculation-anchor',
] as const);

/**
 * RECOVERABLE rows with pre-existing / consumed foundations — not duplicated by this slice.
 * All RECOVERABLE inventory rows except the new persist candidate.
 */
export const W5_N22_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS = Object.freeze([
  'own-platform-backoff-calculation-layer',
  'own-notification-delivery-domain',
  'own-pc06-routing-delivery',
  'own-w5-n17-delivery-reliability-consume',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n19-retry-scheduling-consume',
  'own-w5-n20-retry-policy-consume',
  'own-w5-n21-retry-backoff-consume',
  'own-notification-durable-queue',
  'consume-w5-n21-retry-backoff-anchor',
  'consume-w5-n21-retry-backoff-restart-recovery',
  'consume-w5-n21-retry-backoff-continuity',
  'consume-w5-n17-delivery-reliability-anchor',
  'consume-w5-n18-retry-execution-anchor',
  'consume-w5-n19-retry-scheduling-anchor',
  'consume-w5-n20-retry-policy-anchor',
  'runtime-pc06-resolve-delivery-routing',
  'state-n21-backoff-anchor-reference',
  'dep-w5-n21-inventory-reference',
  'missing-backoff-calculation-persistence',
] as const);

export type W5N22BPersistedArtifactId = (typeof W5_N22_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N22BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N22_B_NOTIFICATION_OWNER;
  classification: 'RECOVERABLE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N22_B_DURABLE_COVERAGE: readonly W5N22BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-candidate-backoff-calculation-anchor',
    artifact:
      'Canonical Notification Platform Retry Backoff Calculation anchors on Notification Delivery owner',
    owner: W5_N22_B_NOTIFICATION_OWNER,
    classification: 'RECOVERABLE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetryBackoffCalculationAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-backoff-calculation-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-backoff-calculation-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260912170000_w5_n22_b_notification_platform_retry_backoff_calculation_anchor/migration.sql',
  }),
]);

export const W5_N22_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'calculationAnchorId',
  'platformBackoffCalculationType',
  'calculationAnchorState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N22_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateBackoffSubsystem: false,
  duplicateCalculationSubsystem: false,
  duplicateRoutingEngine: false,
  calculationEngineIntroduced: false,
  backoffEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  schedulerIntroduced: false,
  workerIntroduced: false,
  runtimeCalculationIntroduced: false,
  backoffCalculationImplementation: false,
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
  backoffCalculationFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  backoffCalculationFunctionalClaimed: false,
  w5N22CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  backoffCalculationRestartSurvivalClaimed: false,
  calculationRuntimeImplemented: false,
  schedulingImplemented: false,
  executionImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N22_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'calculation-runtime',
  'backoff-calculation-runtime',
  'retry-scheduling',
  'retry-execution',
  'retry-lifecycle',
  'timers',
  'workers',
  'orchestration',
  'scheduler',
  'exponential-backoff',
  'linear-backoff',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'calculation-engine',
  'backoff-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus',
] as const);

export const W5_N22_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Retry Backoff Calculation persistence foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N22-c — Restart Recovery Foundation',
    'W5-N22-d — Operational Continuity Foundation',
    'W5-N22-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N22_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N22-a)',
  after: 'Durable Persistence (W5-N22-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N22-c)',
    'Operational continuity (W5-N22-d)',
    'Package Close evidence (W5-N22-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter((row) =>
    (W5_N22_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingRecoverableInventoryRows(): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter((row) =>
    (W5_N22_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N22_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowRecoverable: boolean;
  ownershipRowRecoverable: boolean;
  noBackoffCalculationAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-backoff-calculation-layer',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.classification === 'RECOVERABLE' &&
      ownership?.classification === 'RECOVERABLE' &&
      persisted.every((row) => !row.authorizesBackoffCalculationFunctional),
    persistedRowRecoverable: persisted[0]?.classification === 'RECOVERABLE',
    ownershipRowRecoverable: ownership?.classification === 'RECOVERABLE',
    noBackoffCalculationAuthorization: persisted.every(
      (row) => !row.authorizesBackoffCalculationFunctional && !row.authorizesW5N22Complete,
    ),
  });
}
