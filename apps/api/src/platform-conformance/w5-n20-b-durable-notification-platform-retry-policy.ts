/**
 * W5-N20-b — Durable Notification Platform Retry Policy Foundation registry.
 *
 * Maps approved W5-N20-a inventory to Notification Delivery anchor storage.
 * W5-N20-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N20_A_RETRY_POLICY_INVENTORY,
  type W5N20AInventoryRow,
} from './w5-n20-a-retry-policy-inventory';

export const W5_N20_B_SLICE_ID = 'W5-N20-b' as const;

export const W5_N20_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N20-b. */
export const W5_N20_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-retry-policy-anchor',
] as const);

/** SURVIVE / DURABLE+RECOVERABLE rows with pre-existing persistence — consumed, not duplicated. */
export const W5_N20_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-retry-policy-layer',
  'own-notification-delivery-domain',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n19-retry-scheduling-consume',
  'channel-w5-n01-telegram-anchor',
  'channel-w5-n02-email-anchor',
  'channel-w5-n03-webhook-anchor',
  'channel-w5-n04-push-anchor',
  'consume-w5-n18-retry-execution-anchor',
  'consume-w5-n18-retry-execution-restart-recovery',
  'consume-w5-n18-retry-execution-continuity',
  'consume-w5-n19-retry-scheduling-anchor',
  'consume-w5-n19-retry-scheduling-restart-recovery',
  'consume-w5-n19-retry-scheduling-continuity',
  'runtime-pc06-resolve-delivery-routing',
] as const);

export type W5N20BPersistedArtifactId = (typeof W5_N20_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N20BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N20_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N20_B_DURABLE_COVERAGE: readonly W5N20BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-retry-policy-anchor',
    artifact: 'Canonical Notification Platform Retry Policy anchors on Notification Delivery owner',
    owner: W5_N20_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetryPolicyAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-policy-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-policy-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-policy-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260912130000_w5_n20_b_notification_platform_retry_policy_anchor/migration.sql',
  }),
]);

export const W5_N20_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'retryPolicyAnchorId',
  'platformRetryPolicyType',
  'retryPolicyState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N20_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicatePolicySubsystem: false,
  duplicateRoutingEngine: false,
  policyEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  retryPolicyImplementation: false,
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
  retryPolicyFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  retryPolicyFunctionalClaimed: false,
  w5N20CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  retryPolicyRestartSurvivalClaimed: false,
  policyEvaluationRuntimeImplemented: false,
  backoffCalculationImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N20_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'policy-evaluation-runtime',
  'retry-policy-implementation',
  'backoff',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'policy-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus',
] as const);

export const W5_N20_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Retry Policy persistence foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N20-c — Restart Recovery Foundation',
    'W5-N20-d — Operational Continuity Foundation',
    'W5-N20-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N20_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N20-a)',
  after: 'Durable Persistence (W5-N20-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N20-c)',
    'Operational continuity (W5-N20-d)',
    'Package Close evidence (W5-N20-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N20AInventoryRow[] {
  return W5_N20_A_RETRY_POLICY_INVENTORY.filter((row) =>
    (W5_N20_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N20AInventoryRow[] {
  return W5_N20_A_RETRY_POLICY_INVENTORY.filter((row) =>
    (W5_N20_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N20_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noRetryPolicyAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N20_A_RETRY_POLICY_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-retry-policy-layer',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      persisted.every((row) => !row.authorizesRetryPolicyFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noRetryPolicyAuthorization: persisted.every(
      (row) => !row.authorizesRetryPolicyFunctional && !row.authorizesW5N20Complete,
    ),
  });
}
