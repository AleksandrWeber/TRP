/**
 * W5-N14-b — Durable Notification Platform Dead Letter Foundation registry.
 *
 * Maps approved W5-N14-a inventory to Notification Delivery anchor storage.
 * W5-N14-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N14_A_NOTIFICATION_PLATFORM_DEAD_LETTER_INVENTORY,
  type W5N14AInventoryRow,
} from './w5-n14-a-notification-platform-dead-letter-inventory';

export const W5_N14_B_SLICE_ID = 'W5-N14-b' as const;

export const W5_N14_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N14-b. */
export const W5_N14_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-dead-letter-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N14_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-dead-letter-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n13-retry-persistence',
  'own-w5-n13-retry-foundation-consume',
] as const);

export type W5N14BPersistedArtifactId = (typeof W5_N14_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N14BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N14_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N14_B_DURABLE_COVERAGE: readonly W5N14BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-dead-letter-anchor',
    artifact: 'Canonical Notification Platform Dead Letter anchors on Notification Delivery owner',
    owner: W5_N14_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformDeadLetterAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-dead-letter-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-dead-letter-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-dead-letter-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902170000_w5_n14_b_notification_platform_dead_letter_anchor/migration.sql',
  }),
]);

export const W5_N14_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'deadLetterAnchorId',
  'platformDeadLetterType',
  'deadLetterState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N14_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformDeadLetterImplementation: false,
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
  platformDeadLetterFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformDeadLetterFunctionalClaimed: false,
  w5N14CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformDeadLetterRestartSurvivalClaimed: false,
  deadLetterRuntimeImplemented: false,
  deadLetterReplayImplemented: false,
  deadLetterProcessingImplemented: false,
  retryIntegrationImplemented: false,
  schedulerIntegrationImplemented: false,
  workersIntegrationImplemented: false,
} as const);

export const W5_N14_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'platform-dead-letter-runtime',
  'dead-letter-runtime-implementation',
  'dead-letter-replay-implementation',
  'dead-letter-processing-implementation',
  'retry-integration',
  'scheduler-integration',
  'workers-integration',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N14_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Dead Letter Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N14-d — Notification Platform Dead Letter Operational Continuity Foundation',
    'W5-N14-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N14_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N14-a)',
  after: 'Durable Persistence (W5-N14-b)',
  stillMissing: Object.freeze([
    'Operational Continuity (W5-N14-d)',
    'Package Close (W5-N14-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N14AInventoryRow[] {
  return W5_N14_A_NOTIFICATION_PLATFORM_DEAD_LETTER_INVENTORY.filter((row) =>
    (W5_N14_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N14AInventoryRow[] {
  return W5_N14_A_NOTIFICATION_PLATFORM_DEAD_LETTER_INVENTORY.filter((row) =>
    (W5_N14_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N14_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformDeadLetterAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N14_A_NOTIFICATION_PLATFORM_DEAD_LETTER_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-dead-letter-persistence',
  );
  const missingRow = W5_N14_A_NOTIFICATION_PLATFORM_DEAD_LETTER_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-dead-letter-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformDeadLetterFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformDeadLetterAuthorization: persisted.every(
      (row) => !row.authorizesPlatformDeadLetterFunctional && !row.authorizesW5N14Complete,
    ),
  });
}
