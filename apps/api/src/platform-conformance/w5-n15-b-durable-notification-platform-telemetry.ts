/**
 * W5-N15-b — Durable Notification Platform Telemetry Foundation registry.
 *
 * Maps approved W5-N15-a inventory to Notification Delivery anchor storage.
 * W5-N15-c adds restart recovery hydrate — not operational continuity.
 */

import {
  W5_N15_A_NOTIFICATION_PLATFORM_TELEMETRY_INVENTORY,
  type W5N15AInventoryRow,
} from './w5-n15-a-notification-platform-telemetry-inventory';

export const W5_N15_B_SLICE_ID = 'W5-N15-b' as const;

export const W5_N15_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N15-b. */
export const W5_N15_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-notification-platform-telemetry-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N15_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'own-platform-telemetry-persistence',
  'own-notification-durable-queue',
  'own-pc06-routing-delivery',
  'own-per-channel-foundations-reference',
  'consume-w5-n14-dead-letter-persistence',
  'own-w5-n14-dead-letter-foundation-consume',
] as const);

export type W5N15BPersistedArtifactId = (typeof W5_N15_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N15BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N15_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N15_B_DURABLE_COVERAGE: readonly W5N15BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-notification-platform-telemetry-anchor',
    artifact: 'Canonical Notification Platform Telemetry anchors on Notification Delivery owner',
    owner: W5_N15_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceNotificationPlatformTelemetryAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/notification-platform-telemetry-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-telemetry-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/notification-platform-telemetry-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260902180000_w5_n15_b_notification_platform_telemetry_anchor/migration.sql',
  }),
]);

export const W5_N15_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'telemetryAnchorId',
  'platformTelemetryType',
  'telemetryState',
  'channelScope',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N15_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  platformTelemetryImplementation: false,
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
  platformTelemetryFunctional: false,
  productionTransportIo: false,
  customerVisibleFeature: false,
  platformTelemetryFunctionalClaimed: false,
  w5N15CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  platformTelemetryRestartSurvivalClaimed: false,
  metricsCollectionImplemented: false,
  exportersImplemented: false,
  dashboardsImplemented: false,
  runtimeAggregationImplemented: false,
} as const);

export const W5_N15_B_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'platform-telemetry-runtime',
  'metrics-collection-implementation',
  'exporter-implementation',
  'dashboard-implementation',
  'runtime-aggregation-implementation',
  'production-transport-i/o',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
] as const);

export const W5_N15_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Telemetry Durable Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N15-c — Notification Platform Telemetry Restart Recovery Foundation',
    'W5-N15-d — Notification Platform Telemetry Operational Continuity Foundation',
    'W5-N15-e — Package Close Evidence',
  ] as const),
} as const);

export const W5_N15_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N15-a)',
  after: 'Durable Persistence (W5-N15-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N15-c)',
    'Operational Continuity (W5-N15-d)',
    'Package Close (W5-N15-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N15AInventoryRow[] {
  return W5_N15_A_NOTIFICATION_PLATFORM_TELEMETRY_INVENTORY.filter((row) =>
    (W5_N15_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N15AInventoryRow[] {
  return W5_N15_A_NOTIFICATION_PLATFORM_TELEMETRY_INVENTORY.filter((row) =>
    (W5_N15_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N15_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}

export function verifyInventorySynchronization(): Readonly<{
  ok: boolean;
  persistedRowSurvives: boolean;
  ownershipRowSurvives: boolean;
  noPlatformTelemetryAuthorization: boolean;
}> {
  const persisted = newPersistedInventoryRows();
  const ownership = W5_N15_A_NOTIFICATION_PLATFORM_TELEMETRY_INVENTORY.find(
    (row) => row.artifactId === 'own-platform-telemetry-persistence',
  );
  const missingRow = W5_N15_A_NOTIFICATION_PLATFORM_TELEMETRY_INVENTORY.find(
    (row) => row.artifactId === 'missing-platform-telemetry-anchors',
  );
  return Object.freeze({
    ok:
      persisted.length === 1 &&
      persisted[0]?.durabilityClass === 'SURVIVE' &&
      ownership?.durabilityClass === 'SURVIVE' &&
      missingRow === undefined &&
      persisted.every((row) => !row.authorizesPlatformTelemetryFunctional),
    persistedRowSurvives: persisted[0]?.durabilityClass === 'SURVIVE',
    ownershipRowSurvives: ownership?.durabilityClass === 'SURVIVE',
    noPlatformTelemetryAuthorization: persisted.every(
      (row) => !row.authorizesPlatformTelemetryFunctional && !row.authorizesW5N15Complete,
    ),
  });
}
