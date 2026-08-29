export const SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_SCHEMA_VERSION = 1;

export const SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_DELIVERY_STATES = Object.freeze([
  'anchor-recorded',
] as const);

export type SlackDiscordTeamsNotificationAnchorDeliveryState =
  (typeof SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_DELIVERY_STATES)[number];

export const SLACK_DISCORD_TEAMS_WEBHOOK_NOTIFICATION_CHANNELS = Object.freeze([
  'slack',
  'discord',
  'teams',
] as const);

export type SlackDiscordTeamsWebhookNotificationChannel =
  (typeof SLACK_DISCORD_TEAMS_WEBHOOK_NOTIFICATION_CHANNELS)[number];

export type DurableSlackDiscordTeamsNotificationAnchor = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier: string | null;
  templateIdentifier: string | null;
  deliveryState: SlackDiscordTeamsNotificationAnchorDeliveryState;
  integrityMetadata: string | null;
  correlationId: string | null;
  schemaVersion: number;
  recordedAt: string;
  recordedByActorId: string | null;
  updatedAt: string;
}>;

export type SlackDiscordTeamsNotificationAnchorPersistenceOutcome =
  | Readonly<{ ok: true; anchor: DurableSlackDiscordTeamsNotificationAnchor }>
  | Readonly<{ ok: false; reason: string }>;

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ISO timestamp for ${label}: ${value}`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}

function buildIntegrityMetadata(input: {
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier: string | null;
  templateIdentifier: string | null;
  deliveryState: SlackDiscordTeamsNotificationAnchorDeliveryState;
}): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    notificationId: input.notificationId,
    notificationChannel: input.notificationChannel,
    notificationType: input.notificationType,
    recipientIdentifier: input.recipientIdentifier,
    templateIdentifier: input.templateIdentifier,
    deliveryState: input.deliveryState,
  });
}

function isWebhookNotificationChannel(
  channel: string,
): channel is SlackDiscordTeamsWebhookNotificationChannel {
  return (SLACK_DISCORD_TEAMS_WEBHOOK_NOTIFICATION_CHANNELS as readonly string[]).includes(channel);
}

/**
 * Build durable Slack / Discord / Teams notification anchor for persistence (W5-N03-b).
 * Stores canonical notification anchors only — not webhook transport or outbound delivery.
 */
export function buildSlackDiscordTeamsNotificationAnchorState(input: {
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: SlackDiscordTeamsNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
  prior: DurableSlackDiscordTeamsNotificationAnchor | null;
}): SlackDiscordTeamsNotificationAnchorPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.notificationId, 'notificationId');
  assertNonEmpty(input.notificationChannel, 'notificationChannel');
  assertNonEmpty(input.notificationType, 'notificationType');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (input.prior !== null && input.prior.notificationId !== input.notificationId) {
    return Object.freeze({ ok: false, reason: 'notification_id_mismatch' });
  }

  const notificationChannel = input.notificationChannel.trim().toLowerCase();
  if (!isWebhookNotificationChannel(notificationChannel)) {
    return Object.freeze({
      ok: false,
      reason: 'notification_channel_must_be_slack_discord_or_teams',
    });
  }

  const deliveryState = input.deliveryState ?? 'anchor-recorded';
  const recipientIdentifier =
    input.recipientIdentifier?.trim() ?? input.prior?.recipientIdentifier ?? null;
  const templateIdentifier =
    input.templateIdentifier?.trim() ?? input.prior?.templateIdentifier ?? null;
  const notificationType = input.notificationType.trim();

  const anchor = Object.freeze({
    workspaceId: input.workspaceId,
    notificationId: input.notificationId,
    notificationChannel,
    notificationType,
    recipientIdentifier,
    templateIdentifier,
    deliveryState,
    integrityMetadata: buildIntegrityMetadata({
      workspaceId: input.workspaceId,
      notificationId: input.notificationId,
      notificationChannel,
      notificationType,
      recipientIdentifier,
      templateIdentifier,
      deliveryState,
    }),
    correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
    schemaVersion: SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
    recordedAt: input.recordedAt,
    recordedByActorId: input.actorId ?? input.prior?.recordedByActorId ?? null,
    updatedAt: input.recordedAt,
  });

  return Object.freeze({ ok: true, anchor });
}
