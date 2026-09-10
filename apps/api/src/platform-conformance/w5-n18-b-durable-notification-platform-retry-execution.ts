/**
 * W5-N18-b — Durable Notification Platform Retry Execution Foundation registry.
 *
 * Maps approved W5-N18-a inventory to Notification Delivery anchor storage.
 * W5-N18-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N18_A_RETRY_EXECUTION_INVENTORY,
  type W5N18AInventoryRow,
} from './w5-n18-a-retry-execution-inventory';

export const W5_N18_B_SLICE_ID = 'W5-N18-b' as const;

export const W5_N18_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N18-b. */
export const W5_N18_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-retry-execution-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N18_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-retry-execution-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n16-metrics-persistence',
  'consume-w5-n15-telemetry-persistence',
  'consume-w5-n14-dead-letter-persistence',
  'own-w5-n13-retry-foundation-consume',
  'own-w5-n17-delivery-reliability-consume',
] as const);

export type W5N18BPersistedArtifactId = (typeof W5_N18_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N18BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N18_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N18_B_DURABLE_COVERAGE: readonly W5N18BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-retry-execution-anchor',
    artifact:
      'Canonical Notification Platform Retry Execution anchors on Notification Delivery owner',
    owner: W5_N18_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetryExecutionAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-execution-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-execution-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260910190000_w5_n18_b_notification_platform_retry_execution_anchor/migration.sql',
  }),
]);

export const W5_N18_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'retryExecutionAnchorId',
  'platformRetryExecutionType',
  'retryExecutionState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N18_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  retryExecutionImplementation: false,
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
  retryExecutionFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  retryExecutionFunctionalClaimed: false,
  w5N18CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  retryExecutionRestartSurvivalClaimed: false,
  deliveryExecutionImplemented: false,
  retryExecutionImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N18_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'retry-execution-runtime',
  'retry-execution-implementation',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'retry-platform',
  'workflow-engine',
  'scheduler-product',
  'event-bus-product',
] as const);

export const W5_N18_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Retry Execution Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze(['Final Package Integration Verification'] as const),
} as const);

export const W5_N18_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N18-a)',
  after: 'Durable Persistence (W5-N18-b)',
  stillMissing: Object.freeze(['Package Close evidence (W5-N18-e)'] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N18AInventoryRow[] {
  return W5_N18_A_RETRY_EXECUTION_INVENTORY.filter((row) =>
    (W5_N18_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N18AInventoryRow[] {
  return W5_N18_A_RETRY_EXECUTION_INVENTORY.filter((row) =>
    (W5_N18_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N18_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noRetryExecutionAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N18_A_RETRY_EXECUTION_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-retry-execution-persistence',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      persisted.every((row) => !row.authorizesRetryExecutionFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noRetryExecutionAuthorization: persisted.every(
      (row) => !row.authorizesRetryExecutionFunctional && !row.authorizesW5N18Complete,
    ),
  });
}
