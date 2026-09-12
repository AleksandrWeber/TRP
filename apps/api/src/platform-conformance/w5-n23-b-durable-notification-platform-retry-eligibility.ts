/**
 * W5-N23-b — Durable Notification Platform Retry Eligibility Foundation registry.
 *
 * Maps approved W5-N23-a inventory to Notification Delivery eligibility anchor storage.
 * Storage only — not eligibility evaluation, not calculation, not scheduling, not execution.
 * Restart recovery is W5-N23-c — not implemented here.
 */

import {
  W5_N23_A_RETRY_ELIGIBILITY_INVENTORY,
  type W5N23AInventoryRow,
} from './w5-n23-a-retry-eligibility-inventory';

export const W5_N23_B_SLICE_ID = 'W5-N23-b' as const;

export const W5_N23_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N23-b. */
export const W5_N23_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-candidate-eligibility-anchor',
] as const);

/**
 * RECOVERABLE rows with pre-existing / consumed foundations — not duplicated by this slice.
 * All RECOVERABLE inventory rows except the new persist candidate.
 */
export const W5_N23_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS = Object.freeze([
  'own-platform-eligibility-layer',
  'own-notification-delivery-domain',
  'own-pc06-routing-delivery',
  'own-w5-n17-delivery-reliability-consume',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n19-retry-scheduling-consume',
  'own-w5-n20-retry-policy-consume',
  'own-w5-n21-retry-backoff-consume',
  'own-w5-n22-retry-backoff-calculation-consume',
  'own-notification-durable-queue',
  'consume-w5-n17-delivery-reliability-anchor',
  'consume-w5-n18-retry-execution-anchor',
  'consume-w5-n19-retry-scheduling-anchor',
  'consume-w5-n20-retry-policy-anchor',
  'consume-w5-n21-retry-backoff-anchor',
  'consume-w5-n22-retry-backoff-calculation-anchor',
  'consume-w5-n22-retry-backoff-calculation-restart-recovery',
  'consume-w5-n22-retry-backoff-calculation-continuity',
  'runtime-pc06-resolve-delivery-routing',
  'state-n22-backoff-calculation-anchor-reference',
  'dep-w5-n22-inventory-reference',
  'missing-eligibility-persistence',
] as const);

export type W5N23BPersistedArtifactId = (typeof W5_N23_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N23BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N23_B_NOTIFICATION_OWNER;
  classification: 'RECOVERABLE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N23_B_DURABLE_COVERAGE: readonly W5N23BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-candidate-eligibility-anchor',
    artifact:
      'Canonical Notification Platform Retry Eligibility anchors on Notification Delivery owner',
    owner: W5_N23_B_NOTIFICATION_OWNER,
    classification: 'RECOVERABLE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetryEligibilityAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-eligibility-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-eligibility-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260912190000_w5_n23_b_notification_platform_retry_eligibility_anchor/migration.sql',
  }),
]);

export const W5_N23_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'eligibilityAnchorId',
  'platformRetryEligibilityType',
  'eligibilityAnchorState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N23_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateEligibilitySubsystem: false,
  duplicateRetrySubsystem: false,
  duplicateRoutingEngine: false,
  eligibilityEngineIntroduced: false,
  retryEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  schedulerIntroduced: false,
  workerIntroduced: false,
  runtimeEligibilityIntroduced: false,
  eligibilityEvaluationImplemented: false,
  eligibilityFunctional: false,
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
  eligibilityFunctionalClaimed: false,
  w5N23CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  eligibilityRestartSurvivalClaimed: false,
  schedulingImplemented: false,
  executionImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N23_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'eligibility-evaluation-runtime',
  'backoff-calculation',
  'retry-scheduling',
  'retry-execution',
  'retry-lifecycle',
  'timers',
  'workers',
  'orchestration',
  'scheduler',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'eligibility-engine',
  'retry-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus',
] as const);

export const W5_N23_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'Durable persistence foundation for Notification Retry Eligibility artifacts',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N23-c — Restart Recovery Foundation',
    'W5-N23-d — Operational Continuity Foundation',
    'W5-N23-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N23_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N23-a)',
  after: 'Durable Persistence (W5-N23-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N23-c)',
    'Operational continuity (W5-N23-d)',
    'Package Close evidence (W5-N23-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter((row) =>
    (W5_N23_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingRecoverableInventoryRows(): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter((row) =>
    (W5_N23_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N23_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowRecoverable: boolean;
  ownershipRowRecoverable: boolean;
  noEligibilityAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-eligibility-layer',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.classification === 'RECOVERABLE' &&
      ownership?.classification === 'RECOVERABLE' &&
      persisted.every((row) => !row.authorizesEligibilityFunctional),
    persistedRowRecoverable: persisted[0]?.classification === 'RECOVERABLE',
    ownershipRowRecoverable: ownership?.classification === 'RECOVERABLE',
    noEligibilityAuthorization: persisted.every(
      (row) => !row.authorizesEligibilityFunctional && !row.authorizesW5N23Complete,
    ),
  });
}
