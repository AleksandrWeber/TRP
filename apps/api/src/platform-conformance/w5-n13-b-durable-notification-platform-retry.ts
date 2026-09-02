/**
 * W5-N13-b — Durable Notification Platform Retry Foundation registry.
 *
 * Maps approved W5-N13-a inventory to Notification Delivery anchor storage.
 * W5-N13-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N13_A_NOTIFICATION_PLATFORM_RETRY_INVENTORY,
  type W5N13AInventoryRow,
} from './w5-n13-a-notification-platform-retry-inventory';

export const W5_N13_B_SLICE_ID = 'W5-N13-b' as const;

export const W5_N13_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N13-b. */
export const W5_N13_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-retry-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N13_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-retry-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n12-scheduler-persistence',
  'own-w5-n12-scheduler-foundation-consume',
] as const);

export type W5N13BPersistedArtifactId = (typeof W5_N13_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N13BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N13_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N13_B_DURABLE_COVERAGE: readonly W5N13BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-retry-anchor',
    artifact: 'Canonical Notification Platform Retry anchors on Notification Delivery owner',
    owner: W5_N13_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformRetryAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-retry-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902160000_w5_n13_b_notification_platform_retry_anchor/migration.sql',
  }),
]);

export const W5_N13_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'retryAnchorId',
  'platformRetryType',
  'retryState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N13_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformRetryImplementation: false,
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
  platformRetryFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformRetryFunctionalClaimed: false,
  w5N13CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformRetryRestartSurvivalClaimed: false,
  retryRuntimeImplemented: false,
  retryExecutionImplemented: false,
  retrySchedulingImplemented: false,
  retryQueueProcessingImplemented: false,
  deadLetterProcessingImplemented: false,
} as const);

export const W5_N13_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'platform-retry-runtime',
  'retry-runtime-implementation',
  'retry-execution-implementation',
  'retry-scheduling-implementation',
  'retry-queue-processing',
  'dead-letter-processing',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N13_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Retry Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N13-d — Notification Platform Retry Operational Continuity Foundation',
    'W5-N13-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N13_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N13-a)',
  after: 'Durable Persistence (W5-N13-b)',
  stillMissing: Object.freeze([
    'Operational Continuity (W5-N13-d)',
    'Package Close (W5-N13-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N13AInventoryRow[] {
  return W5_N13_A_NOTIFICATION_PLATFORM_RETRY_INVENTORY.filter((row) =>
    (W5_N13_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N13AInventoryRow[] {
  return W5_N13_A_NOTIFICATION_PLATFORM_RETRY_INVENTORY.filter((row) =>
    (W5_N13_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N13_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformRetryAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N13_A_NOTIFICATION_PLATFORM_RETRY_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-retry-persistence',
  );
  const missingRow = W5_N13_A_NOTIFICATION_PLATFORM_RETRY_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-retry-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformRetryFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformRetryAuthorization: persisted.every(
      (row) => !row.authorizesPlatformRetryFunctional && !row.authorizesW5N13Complete,
    ),
  });
}
