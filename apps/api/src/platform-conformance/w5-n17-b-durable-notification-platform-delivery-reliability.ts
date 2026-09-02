/**
 * W5-N17-b — Durable Notification Platform Delivery Reliability Foundation registry.
 *
 * Maps approved W5-N17-a inventory to Notification Delivery anchor storage.
 * W5-N17-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N17_A_DELIVERY_RELIABILITY_INVENTORY,
  type W5N17AInventoryRow,
} from './w5-n17-a-delivery-reliability-inventory';

export const W5_N17_B_SLICE_ID = 'W5-N17-b' as const;

export const W5_N17_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N17-b. */
export const W5_N17_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-reliability-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N17_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-reliability-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n16-metrics-persistence',
  'consume-w5-n15-telemetry-persistence',
  'consume-w5-n14-dead-letter-persistence',
  'own-w5-n14-dead-letter-foundation-consume',
] as const);

export type W5N17BPersistedArtifactId = (typeof W5_N17_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N17BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N17_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N17_B_DURABLE_COVERAGE: readonly W5N17BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-reliability-anchor',
    artifact:
      'Canonical Notification Platform Delivery Reliability anchors on Notification Delivery owner',
    owner: W5_N17_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformReliabilityAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-reliability-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-reliability-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-reliability-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902200000_w5_n17_b_notification_platform_reliability_anchor/migration.sql',
  }),
]);

export const W5_N17_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'reliabilityAnchorId',
  'platformReliabilityType',
  'reliabilityState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N17_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  deliveryReliabilityImplementation: false,
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
  deliveryReliabilityFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  deliveryReliabilityFunctionalClaimed: false,
  w5N17CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  deliveryReliabilityRestartSurvivalClaimed: false,
  deliveryExecutionImplemented: false,
  retryExecutionImplemented: false,
  restartRecoveryImplemented: false,
} as const);

export const W5_N17_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'delivery-reliability-runtime',
  'delivery-execution-implementation',
  'retry-execution-implementation',
  'restart-recovery-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N17_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Delivery Reliability Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze(['W5-N17-e Close'] as const),
} as const);

export const W5_N17_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N17-a)',
  after: 'Durable Persistence (W5-N17-b)',
  stillMissing: Object.freeze(['Package Close evidence (W5-N17-e)'] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N17AInventoryRow[] {
  return W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.filter((row) =>
    (W5_N17_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N17AInventoryRow[] {
  return W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.filter((row) =>
    (W5_N17_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N17_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noDeliveryReliabilityAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-reliability-persistence',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      persisted.every((row) => !row.authorizesDeliveryReliabilityFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noDeliveryReliabilityAuthorization: persisted.every(
      (row) => !row.authorizesDeliveryReliabilityFunctional && !row.authorizesW5N17Complete,
    ),
  });
}
