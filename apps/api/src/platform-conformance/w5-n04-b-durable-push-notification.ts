/**
 * W5-N04-b — Durable Push Notification Foundation registry.
 *
 * Maps approved W5-N04-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not Web Push/FCM I/O. Not outbound delivery.
 */

import {
  W5_N04_A_PUSH_NOTIFICATION_INVENTORY,
  type W5N04AInventoryRow,
} from './w5-n04-a-push-notification-inventory';

export const W5_N04_B_SLICE_ID = 'W5-N04-b' as const;

export const W5_N04_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N04-b. */
export const W5_N04_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-push-notification-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N04_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-durable-notification-store',
  'persist-vault-no-push-types',
  'own-notification-persistence',
  'own-notification-durable-queue',
] as const);

export type W5N04BPersistedArtifactId = (typeof W5_N04_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N04BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N04_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N04_B_DURABLE_COVERAGE: readonly W5N04BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-push-notification-anchor',
    artifact: 'Canonical Push notification anchors on Notification Delivery owner',
    owner: W5_N04_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspacePushNotificationAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/push-notification-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-push-notification-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/push-notification-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829170000_w5_n04_b_push_notification_anchor/migration.sql',
  }),
]);

export const W5_N04_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
  'workspaceId',
  'notificationId',
  'notificationChannel',
  'notificationType',
  'recipientIdentifier',
  'templateIdentifier',
  'deliveryState',
  'integrityMetadata',
  'correlationId',
] as const);

export const W5_N04_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  pushTransportImplementation: false,
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
  pushImplementation: false,
  webPushImplementation: false,
  fcmImplementation: false,
  deviceTokenRegistryImplemented: false,
  outboundNotificationDelivery: false,
  customerVisibleFeature: false,
  pushRealDeliveryClaimed: false,
  w5N04CompleteClaimed: false,
  wave5CompleteClaimed: false,
  pushNotificationRestartSurvivalClaimed: false,
} as const);

export const W5_N04_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'push-transport',
  'web-push-transport',
  'fcm-transport',
  'browser-delivery',
  'device-token-registry',
  'outbound-push-delivery',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n04-c',
] as const);

export const W5_N04_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Push Notification Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N04-c — Push notification restart recovery foundation',
    'W5-N04-d — Push operational continuity foundation',
    'W5-N04-e — Security verification + package Close evidence',
  ] as const),
} as const);

export const W5_N04_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N04-a)',
  after: 'Durable Persistence (W5-N04-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N04-c)',
    'Operational Continuity (W5-N04-d)',
    'Package Close (W5-N04-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N04AInventoryRow[] {
  return W5_N04_A_PUSH_NOTIFICATION_INVENTORY.filter((row) =>
    (W5_N04_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N04AInventoryRow[] {
  return W5_N04_A_PUSH_NOTIFICATION_INVENTORY.filter((row) =>
    (W5_N04_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N04_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
