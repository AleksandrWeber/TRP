/**
 * W5-N21-b — Durable Notification Platform Retry Backoff Foundation registry.
 *
 * Maps approved W5-N21-a inventory to Notification Delivery anchor storage.
 * W5-N21-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N21_A_RETRY_BACKOFF_INVENTORY,
  type W5N21AInventoryRow,
} from './w5-n21-a-retry-backoff-inventory';

export const W5_N21_B_SLICE_ID = 'W5-N21-b' as const;

export const W5_N21_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N21-b. */
export const W5_N21_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-retry-backoff-anchor',
] as const);

/** SURVIVE / DURABLE+RECOVERABLE rows with pre-existing persistence — consumed, not duplicated. */
export const W5_N21_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-retry-backoff-layer',
  'own-notification-delivery-domain',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-w5-n17-delivery-reliability-consume',
  'own-w5-n18-retry-execution-consume',
  'own-w5-n19-retry-scheduling-consume',
  'own-w5-n20-retry-policy-consume',
  'channel-w5-n01-telegram-anchor',
  'channel-w5-n02-email-anchor',
  'channel-w5-n03-webhook-anchor',
  'channel-w5-n04-push-anchor',
  'consume-w5-n17-delivery-reliability-anchor',
  'consume-w5-n17-delivery-reliability-restart-recovery',
  'consume-w5-n17-delivery-reliability-continuity',
  'consume-w5-n18-retry-execution-anchor',
  'consume-w5-n18-retry-execution-restart-recovery',
  'consume-w5-n18-retry-execution-continuity',
  'consume-w5-n19-retry-scheduling-anchor',
  'consume-w5-n19-retry-scheduling-restart-recovery',
  'consume-w5-n19-retry-scheduling-continuity',
  'consume-w5-n20-retry-policy-anchor',
  'consume-w5-n20-retry-policy-restart-recovery',
  'consume-w5-n20-retry-policy-continuity',
  'runtime-pc06-resolve-delivery-routing',
] as const);

export type W5N21BPersistedArtifactId = (typeof W5_N21_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N21BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N21_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N21_B_DURABLE_COVERAGE: readonly W5N21BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-retry-backoff-anchor',
    artifact:
      'Canonical Notification Platform Retry Backoff anchors on Notification Delivery owner',
    owner: W5_N21_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetryBackoffAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-backoff-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-backoff-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260912150000_w5_n21_b_notification_platform_retry_backoff_anchor/migration.sql',
  }),
]);

export const W5_N21_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'retryBackoffAnchorId',
  'platformRetryBackoffType',
  'retryBackoffState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N21_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateBackoffSubsystem: false,
  duplicateRoutingEngine: false,
  backoffEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  retryBackoffImplementation: false,
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
  retryBackoffFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  retryBackoffFunctionalClaimed: false,
  w5N21CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  retryBackoffRestartSurvivalClaimed: false,
  backoffCalculationImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N21_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'backoff-calculation',
  'exponential-backoff',
  'linear-backoff',
  'retry-backoff-implementation',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'backoff-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus',
] as const);

export const W5_N21_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Retry Backoff persistence foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N21-c — Restart Recovery Foundation',
    'W5-N21-d — Operational Continuity Foundation',
    'W5-N21-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N21_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N21-a)',
  after: 'Durable Persistence (W5-N21-b)',
  stillMissing: Object.freeze([
    'Restart recovery (W5-N21-c)',
    'Operational continuity (W5-N21-d)',
    'Package Close evidence (W5-N21-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N21AInventoryRow[] {
  return W5_N21_A_RETRY_BACKOFF_INVENTORY.filter((row) =>
    (W5_N21_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N21AInventoryRow[] {
  return W5_N21_A_RETRY_BACKOFF_INVENTORY.filter((row) =>
    (W5_N21_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N21_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noRetryBackoffAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N21_A_RETRY_BACKOFF_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-retry-backoff-layer',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      persisted.every((row) => !row.authorizesRetryBackoffFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noRetryBackoffAuthorization: persisted.every(
      (row) => !row.authorizesRetryBackoffFunctional && !row.authorizesW5N21Complete,
    ),
  });
}
