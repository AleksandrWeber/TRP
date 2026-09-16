/**
 * PC-07 — channel-agnostic product views over existing Notification Delivery.
 *
 * Notification Delivery remains owner. Telegram, Email, Slack, and Discord are active
 * transports. Teams/Push stay reserved-inactive. Not a scheduler.
 */

import type { DeliveryResult, DeliverySkipReason } from '../notification-delivery/domain/delivery';
import type {
  NotificationChannelDescriptor,
  NotificationChannelId,
} from '../notification-delivery/domain/notification-channel';
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '../notification-delivery/domain/notification-type';
import type { DiscordConnection } from '../notification-delivery/domain/discord-connection';
import type { DiscordTransportProjection } from '../notification-delivery/domain/discord-transport-projection';
import type { EmailConnection } from '../notification-delivery/domain/email-connection';
import type { EmailTransportProjection } from '../notification-delivery/domain/email-transport-projection';
import type { SlackConnection } from '../notification-delivery/domain/slack-connection';
import type { SlackTransportProjection } from '../notification-delivery/domain/slack-transport-projection';
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';
import type { TelegramTransportProjection } from '../notification-delivery/domain/telegram-transport-projection';
import type { UserNotificationPreferences } from '../notification-delivery/domain/user-notification-preferences';
import {
  deliveryMatchesQuery,
  toDeliveryPageView,
  toPreferenceClockView,
  toRoutingView,
  type ListNotificationDeliveriesQuery,
  type NotificationDeliveryPageView,
  type PreferenceClockView,
} from './notification.view';

export const RESERVED_CHANNEL_REQUIRED_FIELDS: Readonly<
  Record<
    Exclude<NotificationChannelId, 'telegram' | 'email' | 'slack' | 'discord'>,
    readonly string[]
  >
> = Object.freeze({
  teams: Object.freeze(['Webhook', 'Team', 'Channel']),
  push: Object.freeze(['Device', 'Browser']),
});

export const EMAIL_CHANNEL_REQUIRED_FIELDS = Object.freeze([
  'SMTP credentials (Connections)',
  'Recipient',
  'Send test',
]);

export const SLACK_CHANNEL_REQUIRED_FIELDS = Object.freeze([
  'Slack Incoming Webhook (Connections)',
  'Bind',
  'Send test',
]);

export const DISCORD_CHANNEL_REQUIRED_FIELDS = Object.freeze([
  'Discord Incoming Webhook (Connections)',
  'Bind',
  'Send test',
]);

export type ChannelConfigurationKind =
  | 'telegram-connection'
  | 'email-connection'
  | 'slack-connection'
  | 'discord-connection'
  | 'reserved-inactive';

export type NotificationChannelCardView = {
  channelId: NotificationChannelId;
  label: string;
  status: 'active' | 'reserved-inactive';
  offered: boolean;
  enabled: boolean;
  configurable: boolean;
  testAvailable: boolean;
  connectAvailable: boolean;
  configurationKind: ChannelConfigurationKind;
  transport:
    | TelegramTransportProjection['transport']
    | EmailTransportProjection['transport']
    | SlackTransportProjection['transport']
    | DiscordTransportProjection['transport']
    | 'none';
  connectionStatus:
    | TelegramConnection['status']
    | EmailConnection['status']
    | SlackConnection['status']
    | DiscordConnection['status']
    | 'reserved-inactive';
  liveTransportActivated: boolean;
  botApiUsed: boolean;
  authorityClass: 'notification-projection';
};

export type NotificationChannelConfigurationView = {
  kind: ChannelConfigurationKind;
  requiredFields: readonly string[];
  configurable: boolean;
  testAvailable: boolean;
  connectAvailable: boolean;
  liveTransportActivated: boolean;
  botApiUsed: boolean;
  userEnteredBind: boolean;
};

export type NotificationDeliveryTimingView = {
  producerTiming: 'immediate-on-deliver';
  dailyDeliveryTime: string;
  timezone: string;
  hourlyDigest: false;
  weeklyDigest: false;
  weekendSuppression: false;
  perTypeFrequency: false;
  perChannelQuietHours: false;
  scheduler: false;
  clockKind: 'preference-clock';
};

export type NotificationRoutingMatrixRowView = {
  type: NotificationType;
  enabled: boolean;
  critical: boolean;
  channels: Readonly<Record<NotificationChannelId, boolean>>;
  currentSkipReasons: readonly DeliverySkipReason[];
};

export type NotificationRoutingMatrixView = {
  rows: NotificationRoutingMatrixRowView[];
  channelIds: readonly NotificationChannelId[];
  offeredChannelIds: readonly NotificationChannelId[];
  deferredChannelsActivated: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelsWorkspaceView = {
  channels: NotificationChannelCardView[];
  routingMatrix: NotificationRoutingMatrixView;
  timing: NotificationDeliveryTimingView;
  scheduleClock: PreferenceClockView;
  quietHours: { start: string; end: string } | null;
  criticalBypassQuietHours: boolean;
  masterEnabled: boolean;
  deferredChannelsActivated: false;
  generatesReports: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelDetailView = NotificationChannelCardView & {
  configuration: NotificationChannelConfigurationView;
  routing: NotificationRoutingMatrixRowView[];
  diagnostics: NotificationChannelDiagnosticsView;
};

export type NotificationChannelDiagnosticsView = {
  channelId: NotificationChannelId;
  connectionState: TelegramConnection['status'] | EmailConnection['status'] | 'reserved-inactive';
  enabled: boolean;
  offered: boolean;
  configurationHealth: 'ready' | 'not-connected' | 'pending' | 'disabled' | 'reserved-inactive';
  lastSuccessfulDeliveryId: string | null;
  lastFailureDeliveryId: string | null;
  lastSkipReason: DeliverySkipReason | null;
  lastDeliveryAt: string | null;
  latencyAvailable: false;
  testAvailable: boolean;
  liveTransportActivated: boolean;
  botApiUsed: boolean;
  scheduler: false;
  authorityClass: 'notification-projection';
};

export function toChannelCardView(input: {
  channel: NotificationChannelDescriptor;
  prefs: UserNotificationPreferences;
  connection: TelegramConnection;
  honesty: TelegramTransportProjection;
  emailConnection?: EmailConnection;
  emailHonesty?: EmailTransportProjection;
  slackConnection?: SlackConnection;
  slackHonesty?: SlackTransportProjection;
  discordConnection?: DiscordConnection;
  discordHonesty?: DiscordTransportProjection;
}): NotificationChannelCardView {
  const offered = input.channel.status === 'active';
  if (input.channel.channelId === 'email') {
    const email = input.emailConnection;
    const emailHonesty = input.emailHonesty ?? {
      transport: 'in-memory' as const,
      smtpUsed: false,
    };
    const recipientBound = Boolean(email?.recipient);
    const enabled = input.prefs.channels.email === true;
    return {
      channelId: 'email',
      label: input.channel.label,
      status: input.channel.status,
      offered,
      enabled,
      configurable: offered,
      testAvailable: offered && recipientBound,
      connectAvailable: offered && email?.status !== 'connected',
      configurationKind: 'email-connection',
      transport: offered ? emailHonesty.transport : 'none',
      connectionStatus: offered ? (email?.status ?? 'not-connected') : 'reserved-inactive',
      liveTransportActivated: offered ? emailHonesty.smtpUsed : false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    };
  }
  if (input.channel.channelId === 'slack') {
    const slack = input.slackConnection;
    const slackHonesty = input.slackHonesty ?? {
      transport: 'in-memory' as const,
      webhookUsed: false,
    };
    const bound = slack?.status === 'pending' || slack?.status === 'connected';
    const enabled = input.prefs.channels.slack === true;
    return {
      channelId: 'slack',
      label: input.channel.label,
      status: input.channel.status,
      offered,
      enabled,
      configurable: offered,
      testAvailable: offered && bound,
      connectAvailable: offered && slack?.status !== 'connected',
      configurationKind: 'slack-connection',
      transport: offered ? slackHonesty.transport : 'none',
      connectionStatus: offered ? (slack?.status ?? 'not-connected') : 'reserved-inactive',
      liveTransportActivated: offered ? slackHonesty.webhookUsed : false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    };
  }
  if (input.channel.channelId === 'discord') {
    const discord = input.discordConnection;
    const discordHonesty = input.discordHonesty ?? {
      transport: 'in-memory' as const,
      webhookUsed: false,
    };
    const bound = discord?.status === 'pending' || discord?.status === 'connected';
    const enabled = input.prefs.channels.discord === true;
    return {
      channelId: 'discord',
      label: input.channel.label,
      status: input.channel.status,
      offered,
      enabled,
      configurable: offered,
      testAvailable: offered && bound,
      connectAvailable: offered && discord?.status !== 'connected',
      configurationKind: 'discord-connection',
      transport: offered ? discordHonesty.transport : 'none',
      connectionStatus: offered ? (discord?.status ?? 'not-connected') : 'reserved-inactive',
      liveTransportActivated: offered ? discordHonesty.webhookUsed : false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    };
  }
  const telegramConnected =
    input.connection.status === 'connected' && Boolean(input.connection.chatId);
  const enabled = input.prefs.channels[input.channel.channelId] === true;
  return {
    channelId: input.channel.channelId,
    label: input.channel.label,
    status: input.channel.status,
    offered,
    enabled,
    configurable: offered,
    testAvailable: offered && telegramConnected,
    connectAvailable: offered && input.connection.status === 'not-connected',
    configurationKind: offered ? 'telegram-connection' : 'reserved-inactive',
    transport: offered ? input.honesty.transport : 'none',
    connectionStatus: offered ? input.connection.status : 'reserved-inactive',
    liveTransportActivated: offered ? input.honesty.botApiUsed : false,
    botApiUsed: offered ? input.honesty.botApiUsed : false,
    authorityClass: 'notification-projection',
  };
}

export function toChannelConfigurationView(
  card: NotificationChannelCardView,
): NotificationChannelConfigurationView {
  if (card.channelId === 'telegram') {
    return {
      kind: 'telegram-connection',
      requiredFields: Object.freeze(['Connect', 'Verify', 'Disconnect', 'Send Test']),
      configurable: true,
      testAvailable: card.testAvailable,
      connectAvailable: card.connectAvailable,
      liveTransportActivated: card.liveTransportActivated,
      botApiUsed: card.botApiUsed,
      userEnteredBind: false,
    };
  }
  if (card.channelId === 'email') {
    return {
      kind: 'email-connection',
      requiredFields: EMAIL_CHANNEL_REQUIRED_FIELDS,
      configurable: true,
      testAvailable: card.testAvailable,
      connectAvailable: card.connectAvailable,
      liveTransportActivated: card.liveTransportActivated,
      botApiUsed: false,
      userEnteredBind: true,
    };
  }
  if (card.channelId === 'slack') {
    return {
      kind: 'slack-connection',
      requiredFields: SLACK_CHANNEL_REQUIRED_FIELDS,
      configurable: true,
      testAvailable: card.testAvailable,
      connectAvailable: card.connectAvailable,
      liveTransportActivated: card.liveTransportActivated,
      botApiUsed: false,
      userEnteredBind: false,
    };
  }
  if (card.channelId === 'discord') {
    return {
      kind: 'discord-connection',
      requiredFields: DISCORD_CHANNEL_REQUIRED_FIELDS,
      configurable: true,
      testAvailable: card.testAvailable,
      connectAvailable: card.connectAvailable,
      liveTransportActivated: card.liveTransportActivated,
      botApiUsed: false,
      userEnteredBind: false,
    };
  }
  return {
    kind: 'reserved-inactive',
    requiredFields: RESERVED_CHANNEL_REQUIRED_FIELDS[card.channelId],
    configurable: false,
    testAvailable: false,
    connectAvailable: false,
    liveTransportActivated: false,
    botApiUsed: false,
    userEnteredBind: false,
  };
}

export function toDeliveryTimingView(
  prefs: UserNotificationPreferences,
): NotificationDeliveryTimingView {
  return {
    producerTiming: 'immediate-on-deliver',
    dailyDeliveryTime: prefs.schedule.dailyDeliveryTime,
    timezone: prefs.schedule.timezone,
    hourlyDigest: false,
    weeklyDigest: false,
    weekendSuppression: false,
    perTypeFrequency: false,
    perChannelQuietHours: false,
    scheduler: false,
    clockKind: 'preference-clock',
  };
}

export function toRoutingMatrixView(input: {
  prefs: UserNotificationPreferences;
  channels: readonly NotificationChannelDescriptor[];
  connection: TelegramConnection;
  evaluatedAt: string;
  honesty: TelegramTransportProjection;
  emailConnection?: EmailConnection;
  slackConnection?: SlackConnection;
  discordConnection?: DiscordConnection;
}): NotificationRoutingMatrixView {
  const routing = toRoutingView(input);
  return {
    rows: routing.typeRouting.map((item) => ({
      type: item.type,
      enabled: item.enabled,
      critical: item.critical,
      channels: Object.freeze(
        Object.fromEntries(
          input.channels.map((channel) => [
            channel.channelId,
            item.channels.includes(channel.channelId),
          ]),
        ),
      ) as Readonly<Record<NotificationChannelId, boolean>>,
      currentSkipReasons: item.currentRoutes
        .map((route) => route.skipReason)
        .filter((reason): reason is DeliverySkipReason => Boolean(reason)),
    })),
    channelIds: input.channels.map((channel) => channel.channelId),
    offeredChannelIds: input.channels
      .filter((channel) => channel.status === 'active')
      .map((channel) => channel.channelId),
    deferredChannelsActivated: false,
    controlPlane: false,
    authorityClass: 'notification-projection',
  };
}

export function toChannelDiagnosticsView(input: {
  card: NotificationChannelCardView;
  deliveries: readonly DeliveryResult[];
}): NotificationChannelDiagnosticsView {
  const attempts = input.deliveries
    .flatMap((delivery) =>
      delivery.attempts
        .filter((attempt) => attempt.channelId === input.card.channelId)
        .map((attempt) => ({ delivery, attempt })),
    )
    .sort((left, right) => right.delivery.createdAt.localeCompare(left.delivery.createdAt));
  const latest = attempts[0];
  const lastSuccess = attempts.find((item) => item.attempt.outcome === 'delivered');
  const lastFailure = attempts.find((item) => item.attempt.outcome === 'failed');
  const configurationHealth = !input.card.offered
    ? 'reserved-inactive'
    : !input.card.enabled
      ? 'disabled'
      : input.card.connectionStatus === 'connected'
        ? 'ready'
        : input.card.connectionStatus === 'pending'
          ? 'pending'
          : 'not-connected';
  return {
    channelId: input.card.channelId,
    connectionState: input.card.connectionStatus,
    enabled: input.card.enabled,
    offered: input.card.offered,
    configurationHealth,
    lastSuccessfulDeliveryId: lastSuccess?.delivery.deliveryId ?? null,
    lastFailureDeliveryId: lastFailure?.delivery.deliveryId ?? null,
    lastSkipReason: latest?.attempt.skipReason ?? null,
    lastDeliveryAt: latest?.delivery.createdAt ?? null,
    latencyAvailable: false,
    testAvailable: input.card.testAvailable,
    liveTransportActivated: input.card.liveTransportActivated,
    botApiUsed: input.card.botApiUsed,
    scheduler: false,
    authorityClass: 'notification-projection',
  };
}

export function toChannelsWorkspaceView(input: {
  prefs: UserNotificationPreferences;
  channels: readonly NotificationChannelDescriptor[];
  connection: TelegramConnection;
  evaluatedAt: string;
  honesty: TelegramTransportProjection;
  emailConnection?: EmailConnection;
  emailHonesty?: EmailTransportProjection;
  slackConnection?: SlackConnection;
  slackHonesty?: SlackTransportProjection;
  discordConnection?: DiscordConnection;
  discordHonesty?: DiscordTransportProjection;
}): NotificationChannelsWorkspaceView {
  const cards = input.channels.map((channel) =>
    toChannelCardView({
      channel,
      prefs: input.prefs,
      connection: input.connection,
      honesty: input.honesty,
      emailConnection: input.emailConnection,
      emailHonesty: input.emailHonesty,
      slackConnection: input.slackConnection,
      slackHonesty: input.slackHonesty,
      discordConnection: input.discordConnection,
      discordHonesty: input.discordHonesty,
    }),
  );
  return {
    channels: cards,
    routingMatrix: toRoutingMatrixView(input),
    timing: toDeliveryTimingView(input.prefs),
    scheduleClock: toPreferenceClockView(input.prefs, input.evaluatedAt),
    quietHours: input.prefs.schedule.quietHours
      ? { start: input.prefs.schedule.quietHours.start, end: input.prefs.schedule.quietHours.end }
      : null,
    criticalBypassQuietHours: input.prefs.schedule.criticalBypassQuietHours,
    masterEnabled: input.prefs.enabled,
    deferredChannelsActivated: false,
    generatesReports: false,
    controlPlane: false,
    authorityClass: 'notification-projection',
  };
}

export function toChannelDetailView(input: {
  channelId: NotificationChannelId;
  prefs: UserNotificationPreferences;
  channels: readonly NotificationChannelDescriptor[];
  connection: TelegramConnection;
  deliveries: readonly DeliveryResult[];
  evaluatedAt: string;
  honesty: TelegramTransportProjection;
  emailConnection?: EmailConnection;
  emailHonesty?: EmailTransportProjection;
  slackConnection?: SlackConnection;
  slackHonesty?: SlackTransportProjection;
  discordConnection?: DiscordConnection;
  discordHonesty?: DiscordTransportProjection;
}): NotificationChannelDetailView | null {
  const descriptor = input.channels.find((channel) => channel.channelId === input.channelId);
  if (!descriptor) return null;
  const card = toChannelCardView({
    channel: descriptor,
    prefs: input.prefs,
    connection: input.connection,
    honesty: input.honesty,
    emailConnection: input.emailConnection,
    emailHonesty: input.emailHonesty,
    slackConnection: input.slackConnection,
    slackHonesty: input.slackHonesty,
    discordConnection: input.discordConnection,
    discordHonesty: input.discordHonesty,
  });
  const matrix = toRoutingMatrixView(input);
  return {
    ...card,
    configuration: toChannelConfigurationView(card),
    routing: matrix.rows.filter((row) => row.channels[input.channelId]),
    diagnostics: toChannelDiagnosticsView({ card, deliveries: input.deliveries }),
  };
}

export function channelDeliveryMatches(
  delivery: DeliveryResult,
  channelId: NotificationChannelId,
  query: ListNotificationDeliveriesQuery,
): boolean {
  if (!delivery.attempts.some((attempt) => attempt.channelId === channelId)) return false;
  return deliveryMatchesQuery(delivery, query);
}

export function toChannelDeliveryPageView(
  items: readonly DeliveryResult[],
): NotificationDeliveryPageView {
  return toDeliveryPageView(items);
}

export { NOTIFICATION_TYPES };
