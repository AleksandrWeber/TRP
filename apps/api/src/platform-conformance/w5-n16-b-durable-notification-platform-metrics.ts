/**
 * W5-N16-b — Durable Notification Platform Metrics Foundation registry.
 *
 * Maps approved W5-N16-a inventory to Notification Delivery anchor storage.
 * W5-N16-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N16_A_NOTIFICATION_PLATFORM_METRICS_INVENTORY,
  type W5N16AInventoryRow,
} from './w5-n16-a-notification-platform-metrics-inventory';

export const W5_N16_B_SLICE_ID = 'W5-N16-b' as const;

export const W5_N16_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N16-b. */
export const W5_N16_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-metrics-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N16_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-metrics-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n15-telemetry-persistence',
  'consume-w5-n14-dead-letter-persistence',
  'own-w5-n14-dead-letter-foundation-consume',
] as const);

export type W5N16BPersistedArtifactId = (typeof W5_N16_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N16BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N16_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N16_B_DURABLE_COVERAGE: readonly W5N16BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-metrics-anchor',
    artifact: 'Canonical Notification Platform Metrics anchors on Notification Delivery owner',
    owner: W5_N16_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformMetricsAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-metrics-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-metrics-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-metrics-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902190000_w5_n16_b_notification_platform_metrics_anchor/migration.sql',
  }),
]);

export const W5_N16_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'metricsAnchorId',
  'platformMetricsType',
  'metricsState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N16_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformMetricsImplementation: false,
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
  platformMetricsFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformMetricsFunctionalClaimed: false,
  w5N16CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformMetricsRestartSurvivalClaimed: false,
  metricsCollectionImplemented: false,
  exportersImplemented: false,
  dashboardsImplemented: false,
  runtimeAggregationImplemented: false,
} as const);

export const W5_N16_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'platform-metrics-runtime',
  'metrics-collection-implementation',
  'exporter-implementation',
  'dashboard-implementation',
  'runtime-aggregation-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N16_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Metrics Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N16-d — Notification Platform Metrics Operational Continuity Foundation',
    'W5-N16-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N16_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N16-a)',
  after: 'Durable Persistence (W5-N16-b)',
  stillMissing: Object.freeze(['Package Close (W5-N16-e)'] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N16AInventoryRow[] {
  return W5_N16_A_NOTIFICATION_PLATFORM_METRICS_INVENTORY.filter((row) =>
    (W5_N16_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N16AInventoryRow[] {
  return W5_N16_A_NOTIFICATION_PLATFORM_METRICS_INVENTORY.filter((row) =>
    (W5_N16_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N16_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformMetricsAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N16_A_NOTIFICATION_PLATFORM_METRICS_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-metrics-persistence',
  );
  const missingRow = W5_N16_A_NOTIFICATION_PLATFORM_METRICS_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-metrics-durable-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformMetricsFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformMetricsAuthorization: persisted.every(
      (row) => !row.authorizesPlatformMetricsFunctional && !row.authorizesW5N16Complete,
    ),
  });
}
