/**
 * W5-N01-b — Durable Telegram Notification Foundation registry.
 *
 * Maps approved W5-N01-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not Bot API I/O. Not outbound delivery.
 */

import {
  W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY,
  type W5N01AInventoryRow,
} from './w5-n01-a-telegram-notification-inventory';

export const W5_N01_B_SLICE_ID = 'W5-N01-b' as const;

export const W5_N01_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N01-b. */
export const W5_N01_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-telegram-notification-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N01_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-durable-notification-store',
  'persist-delivery-queue-w3-o02',
  'persist-vault-telegram-ciphertext',
  'own-notification-persistence',
  'own-notification-durable-queue',
] as const);

export type W5N01BPersistedArtifactId = (typeof W5_N01_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N01BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N01_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N01_B_DURABLE_COVERAGE: readonly W5N01BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-telegram-notification-anchor',
    artifact: 'Canonical Telegram notification anchors on Notification Delivery owner',
    owner: W5_N01_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceTelegramNotificationAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/telegram-notification-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-telegram-notification-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/telegram-notification-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260828140000_w5_n01_b_telegram_notification_anchor/migration.sql',
  }),
]);

export const W5_N01_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
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

export const W5_N01_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  telegramControlPlane: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  exchangeAdapterUntouched: true,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  botApiImplementation: false,
  outboundNotificationDelivery: false,
  customerVisibleFeature: false,
  telegramRealDeliveryClaimed: false,
  w5N01CompleteClaimed: false,
  wave5CompleteClaimed: false,
  telegramNotificationRestartSurvivalClaimed: false,
} as const);

export const W5_N01_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'bot-api-communication',
  'outbound-telegram-delivery',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n01-c',
] as const);

export const W5_N01_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Telegram Notification Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N01-c — Telegram notification restart recovery foundation',
    'W5-N01-d — Operational continuity foundation',
    'W5-N01-e — Security verification + package Close evidence',
  ] as const),
} as const);

export const W5_N01_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N01-a)',
  after: 'Durable Persistence (W5-N01-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N01-c)',
    'Operational Continuity (W5-N01-d)',
    'Package Close (W5-N01-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N01AInventoryRow[] {
  return W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY.filter((row) =>
    (W5_N01_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N01AInventoryRow[] {
  return W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY.filter((row) =>
    (W5_N01_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N01_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
