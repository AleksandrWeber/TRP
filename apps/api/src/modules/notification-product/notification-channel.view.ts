/**
 * PC-07 — channel-agnostic product views over existing Notification Delivery.
 *
 * Notification Delivery remains owner. Telegram is one active transport.
 * Reserved channels stay reserved-inactive. No SMTP/webhook SoT. No Bot API.
 * Not a scheduler. Not a new routing engine.
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
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';
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
  Record<Exclude<NotificationChannelId, 'telegram'>, readonly string[]>
> = Object.freeze({
  email: Object.freeze(['Provider / SMTP', 'Sender', 'Recipient(s)']),
  slack: Object.freeze(['Workspace', 'Webhook', 'Channel']),
  discord: Object.freeze(['Webhook', 'Channel']),
  teams: Object.freeze(['Webhook', 'Team', 'Channel']),
  push: Object.freeze(['Device', 'Browser']),
});

export type ChannelConfigurationKind = 'telegram-connection' | 'reserved-inactive';

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
  transport: 'in-memory' | 'none';
  connectionStatus: TelegramConnection['status'] | 'reserved-inactive';
  liveTransportActivated: false;
  botApiUsed: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelConfigurationView = {
  kind: ChannelConfigurationKind;
  requiredFields: readonly string[];
  configurable: boolean;
  testAvailable: boolean;
  connectAvailable: boolean;
  liveTransportActivated: false;
  botApiUsed: false;
  userEnteredBind: false;
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
  connectionState: TelegramConnection['status'] | 'reserved-inactive';
  enabled: boolean;
  offered: boolean;
  configurationHealth: 'ready' | 'not-connected' | 'pending' | 'disabled' | 'reserved-inactive';
  lastSuccessfulDeliveryId: string | null;
  lastFailureDeliveryId: string | null;
  lastSkipReason: DeliverySkipReason | null;
  lastDeliveryAt: string | null;
  latencyAvailable: false;
  testAvailable: boolean;
  liveTransportActivated: false;
  botApiUsed: false;
  scheduler: false;
  authorityClass: 'notification-projection';
};

export function toChannelCardView(input: {
  channel: NotificationChannelDescriptor;
  prefs: UserNotificationPreferences;
  connection: TelegramConnection;
}): NotificationChannelCardView {
  const offered = input.channel.status === 'active';
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
    transport: offered ? 'in-memory' : 'none',
    connectionStatus: offered ? input.connection.status : 'reserved-inactive',
    liveTransportActivated: false,
    botApiUsed: false,
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
      liveTransportActivated: false,
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
    liveTransportActivated: false,
    botApiUsed: false,
    scheduler: false,
    authorityClass: 'notification-projection',
  };
}

export function toChannelsWorkspaceView(input: {
  prefs: UserNotificationPreferences;
  channels: readonly NotificationChannelDescriptor[];
  connection: TelegramConnection;
  evaluatedAt: string;
}): NotificationChannelsWorkspaceView {
  const cards = input.channels.map((channel) =>
    toChannelCardView({ channel, prefs: input.prefs, connection: input.connection }),
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
}): NotificationChannelDetailView | null {
  const descriptor = input.channels.find((channel) => channel.channelId === input.channelId);
  if (!descriptor) return null;
  const card = toChannelCardView({
    channel: descriptor,
    prefs: input.prefs,
    connection: input.connection,
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
