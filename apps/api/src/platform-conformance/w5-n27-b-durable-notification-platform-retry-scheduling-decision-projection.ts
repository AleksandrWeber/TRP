/**
 * W5-N27-b — Durable Notification Platform Retry Scheduling Decision Projection Foundation registry.
 *
 * Maps approved W5-N27-a inventory to Notification Delivery decision projection anchor storage.
 * Storage only — not runtime decision projection, not scheduling, not eligibility, not backoff
 * calculation, not execution. Restart recovery is W5-N27-c — not implemented here.
 */

import {
  W5_N27_A_BINDING_FINDINGS,
  W5_N27_A_RETRY_SCHEDULING_DECISION_PROJECTION_INVENTORY,
  type W5N27AInventoryRow,
} from './w5-n27-a-retry-scheduling-decision-projection-inventory';

export const W5_N27_B_SLICE_ID = 'W5-N27-b' as const;

export const W5_N27_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N27-b. */
export const W5_N27_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-candidate-projection-anchor',
] as const);

/**
 * RECOVERABLE rows with pre-existing / consumed foundations — not duplicated by this slice.
 * All RECOVERABLE inventory rows except the new persist candidate.
 * Includes `missing-projection-persistence` after W5-N27-b gap resolution.
 */
export const W5_N27_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS = Object.freeze([
  'own-platform-decision-projection-layer',
  'own-notification-delivery-domain',
  'own-pc06-routing-delivery',
  'own-w5-n17-delivery-reliability-consume',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n19-retry-scheduling-consume',
  'own-w5-n20-retry-policy-consume',
  'own-w5-n21-retry-backoff-consume',
  'own-w5-n22-retry-backoff-calculation-consume',
  'own-w5-n23-retry-eligibility-consume',
  'own-w5-n24-retry-scheduling-consume',
  'own-w5-n25-retry-scheduling-decision-consume',
  'own-w5-n26-retry-scheduling-decision-evaluation-consume',
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
  'consume-w5-n24-retry-scheduling-anchor',
  'consume-w5-n24-retry-scheduling-inventory',
  'consume-w5-n24-retry-scheduling-persistence',
  'consume-w5-n24-retry-scheduling-restart-recovery',
  'consume-w5-n24-retry-scheduling-continuity',
  'consume-w5-n25-retry-scheduling-decision-anchor',
  'consume-w5-n25-retry-scheduling-decision-inventory',
  'consume-w5-n25-retry-scheduling-decision-persistence',
  'consume-w5-n25-retry-scheduling-decision-restart-recovery',
  'consume-w5-n25-retry-scheduling-decision-continuity',
  'consume-w5-n26-retry-scheduling-decision-evaluation-anchor',
  'consume-w5-n26-retry-scheduling-decision-evaluation-inventory',
  'consume-w5-n26-retry-scheduling-decision-evaluation-persistence',
  'consume-w5-n26-retry-scheduling-decision-evaluation-restart-recovery',
  'consume-w5-n26-retry-scheduling-decision-evaluation-continuity',
  'missing-projection-persistence',
  'runtime-pc06-resolve-delivery-routing',
  'state-n24-scheduling-anchor-reference',
  'state-n22-backoff-calculation-anchor-reference',
  'state-n23-eligibility-anchor-reference',
  'dep-w5-n22-inventory-reference',
  'dep-w5-n23-inventory-reference',
  'dep-w5-n24-inventory-reference',
] as const);

export type W5N27BPersistedArtifactId = (typeof W5_N27_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N27BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N27_B_NOTIFICATION_OWNER;
  classification: 'RECOVERABLE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N27_B_DURABLE_COVERAGE: readonly W5N27BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-candidate-projection-anchor',
    artifact:
      'Canonical Notification Platform Retry Scheduling Decision Projection anchors on Notification Delivery owner',
    owner: W5_N27_B_NOTIFICATION_OWNER,
    classification: 'RECOVERABLE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-decision-projection-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-scheduling-decision-projection-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260913190000_w5_n27_b_notification_platform_retry_scheduling_decision_projection_anchor/migration.sql',
  }),
]);

export const W5_N27_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'projectionAnchorId',
  'platformRetrySchedulingDecisionProjectionType',
  'projectionAnchorState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N27_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateDecisionProjectionSubsystem: false,
  duplicateRetrySubsystem: false,
  duplicateRoutingEngine: false,
  runtimeDecisionEngineIntroduced: false,
  retryEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  runtimeSchedulerIntroduced: false,
  workerIntroduced: false,
  runtimeDecisionProjectionIntroduced: false,
  runtimeProjectionEngineIntroduced: false,
  runtimeDecisionEvaluationIntroduced: false,
  projectionFunctional: false,
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
  projectionFunctionalClaimed: false,
  w5N27CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  projectionRestartSurvivalClaimed: false,
  survivesProcessTermination: true,
  runtimeSchedulingImplemented: false,
  backoffCalculationImplemented: false,
  eligibilityDeterminationImplemented: false,
  executionImplemented: false,
  restartRecoveryImplemented: false,
  newProjectionPersistenceStackIntroduced: true,
} as const);

export const W5_N27_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'runtime-decision-logic',
  'runtime-decision-projection',
  'runtime-projection-engine',
  'runtime-decision-evaluation',
  'scheduling-decisions',
  'runtime-scheduling',
  'eligibility-determination',
  'backoff-calculation',
  'retry-execution',
  'retry-lifecycle',
  'timers',
  'workers',
  'orchestration',
  'runtime-scheduler',
  'runtime-decision-engine',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'retry-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus',
] as const);

export const W5_N27_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'Durable persistence foundation for Notification Retry Scheduling Decision Projection artifacts',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N27-c — Restart Recovery Foundation',
    'W5-N27-d — Operational Continuity Foundation',
    'W5-N27-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N27_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N26-a)',
  after: 'Durable Persistence (W5-N27-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N27-c)',
    'Operational continuity (W5-N27-d)',
    'Package Close evidence (W5-N27-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N27AInventoryRow[] {
  return W5_N27_A_RETRY_SCHEDULING_DECISION_PROJECTION_INVENTORY.filter((row) =>
    (W5_N27_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingRecoverableInventoryRows(): readonly W5N27AInventoryRow[] {
  return W5_N27_A_RETRY_SCHEDULING_DECISION_PROJECTION_INVENTORY.filter((row) =>
    (W5_N27_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N27_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowRecoverable: boolean;
  ownershipRowRecoverable: boolean;
  noDecisionAuthorization: boolean;
  projectionPersistenceMissingResolved: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N27_A_RETRY_SCHEDULING_DECISION_PROJECTION_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-decision-projection-layer',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.classification === 'RECOVERABLE' &&
      persisted[0]?.existsToday === true &&
      ownership?.classification === 'RECOVERABLE' &&
      persisted.every((row) => !row.authorizesProjectionFunctional) &&
      W5_N27_A_BINDING_FINDINGS.projectionPersistenceMissing === false,
    persistedRowRecoverable: persisted[0]?.classification === 'RECOVERABLE',
    ownershipRowRecoverable: ownership?.classification === 'RECOVERABLE',
    noDecisionAuthorization: persisted.every(
      (row) => !row.authorizesProjectionFunctional && !row.authorizesW5N27Complete,
    ),
    projectionPersistenceMissingResolved:
      W5_N27_A_BINDING_FINDINGS.projectionPersistenceMissing === false,
  });
}
