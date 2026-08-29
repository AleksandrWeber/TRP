/**
 * W5-N03-b — Durable Slack / Discord / Teams Notification Foundation registry.
 *
 * Maps approved W5-N03-a inventory to Notification Delivery anchor storage.
 * Not restart recovery. Not operational continuity. Not webhook I/O. Not outbound delivery.
 */

import {
  W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY,
  type W5N03AInventoryRow,
} from './w5-n03-a-slack-discord-teams-notification-inventory';

export const W5_N03_B_SLICE_ID = 'W5-N03-b' as const;

export const W5_N03_B_NOTIFICATION_OWNER = 'notification-delivery' as const;

/** New durable persistence implemented in W5-N03-b. */
export const W5_N03_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-slack-discord-teams-notification-anchor',
] as const);

/** SURVIVE rows with pre-existing persistence on canonical owners — consumed, not duplicated. */
export const W5_N03_B_PREEXISTING_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'persist-durable-notification-store',
  'persist-vault-no-webhook-types',
  'own-notification-persistence',
  'own-notification-durable-queue',
] as const);

export type W5N03BPersistedArtifactId = (typeof W5_N03_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W5N03BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W5_N03_B_NOTIFICATION_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W5_N03_B_DURABLE_COVERAGE: readonly W5N03BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-slack-discord-teams-notification-anchor',
    artifact:
      'Canonical Slack / Discord / Teams notification anchors on Notification Delivery owner',
    owner: W5_N03_B_NOTIFICATION_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceSlackDiscordTeamsNotificationAnchor',
    repositoryPort:
      'apps/api/src/modules/notification-delivery/domain/slack-discord-teams-notification-anchor.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/notification-delivery/persistence/prisma-slack-discord-teams-notification-anchor.repository.ts',
    persistenceService:
      'apps/api/src/modules/notification-delivery/slack-discord-teams-notification-persistence.service.ts',
    migration:
      'apps/api/prisma/migrations/20260829160000_w5_n03_b_slack_discord_teams_notification_anchor/migration.sql',
  }),
]);

export const W5_N03_B_CANONICAL_ANCHOR_FIELDS = Object.freeze([
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

export const W5_N03_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  webhookTransportImplementation: false,
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
  webhookImplementation: false,
  outboundNotificationDelivery: false,
  customerVisibleFeature: false,
  webhookRealDeliveryClaimed: false,
  w5N03CompleteClaimed: false,
  wave5CompleteClaimed: false,
  slackDiscordTeamsNotificationRestartSurvivalClaimed: false,
} as const);

export const W5_N03_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'webhook-transport',
  'outbound-slack-discord-teams-delivery',
  'runtime-notifications',
  'live-trading-enablement',
  'second-persistence-owner',
  'w5-n03-c',
] as const);

export const W5_N03_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Durable Slack / Discord / Teams Notification Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N03-c — Slack / Discord / Teams notification restart recovery foundation',
    'W5-N03-d — Operational continuity foundation',
    'W5-N03-e — Security verification + package Close evidence',
  ] as const),
} as const);

export const W5_N03_B_TRANSITION_MATRIX = Object.freeze({
  before: 'Inventory (W5-N03-a)',
  after: 'Durable Persistence (W5-N03-b)',
  stillMissing: Object.freeze([
    'Restart Recovery (W5-N03-c)',
    'Operational Continuity (W5-N03-d)',
    'Package Close (W5-N03-e)',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W5N03AInventoryRow[] {
  return W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.filter((row) =>
    (W5_N03_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSurviveInventoryRows(): readonly W5N03AInventoryRow[] {
  return W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.filter((row) =>
    (W5_N03_B_PREEXISTING_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W5_N03_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
