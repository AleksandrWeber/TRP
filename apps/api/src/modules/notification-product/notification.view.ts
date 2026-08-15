/**
 * PC-06 — HTTP product views of existing Notification Delivery artifacts.
 *
 * Notification Delivery remains delivery owner. Reporting remains report owner.
 * Telegram remains transport only. Not a scheduler. Not a new SoT.
 * Chat id and connection tokens are never product fields (PC-07 owns connect).
 */

import {
  toChannelDeliveryView,
  type ChannelDeliveryView,
} from '../product-flow/channel-delivery.view';
import type {
  DeliveryOutcome,
  DeliveryResult,
  DeliverySkipReason,
} from '../notification-delivery/domain/delivery';
import type {
  NotificationChannelDescriptor,
  NotificationChannelId,
} from '../notification-delivery/domain/notification-channel';
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '../notification-delivery/domain/notification-type';
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';
import type {
  QuietHours,
  TypeDeliveryPreference,
  UserNotificationPreferences,
} from '../notification-delivery/domain/user-notification-preferences';
import {
  extractLocalTimeHHmm,
  isWithinQuietHours,
  resolveDeliveryRoutes,
  type RoutedChannel,
} from '../notification-delivery/routing/resolve-delivery-routing';

export type NotificationChannelView = {
  channelId: NotificationChannelId;
  status: 'active' | 'reserved-inactive';
  label: string;
  offered: boolean;
  authorityClass: 'notification-projection';
};

export type NotificationChannelPageView = {
  items: NotificationChannelView[];
  deferredChannelsActivated: false;
  authorityClass: 'notification-projection';
};

export type TypeRoutingView = {
  type: NotificationType;
  enabled: boolean;
  channels: readonly NotificationChannelId[];
  critical: boolean;
  currentRoutes: readonly RoutedChannel[];
};

export type QuietHoursView = {
  start: string;
  end: string;
} | null;

export type NotificationScheduleView = {
  dailyDeliveryTime: string;
  timezone: string;
  quietHours: QuietHoursView;
  criticalBypassQuietHours: boolean;
};

export type NotificationPreferencesView = {
  workspaceId: string;
  userId: string;
  enabled: boolean;
  channels: Readonly<Record<NotificationChannelId, boolean>>;
  typeRouting: readonly TypeRoutingView[];
  schedule: NotificationScheduleView;
  updatedAt: string;
  authorityClass: 'notification-projection';
  generatesReports: false;
  controlPlane: false;
};

export type TelegramConnectionStatusView = {
  status: TelegramConnection['status'];
  connected: boolean;
  chatBound: boolean;
  connectedAt: string | null;
  updatedAt: string;
  connectAvailable: false;
  testAvailable: false;
  controlPlane: false;
  transport: 'in-memory';
};

export type PreferenceClockView = {
  timezone: string;
  dailyDeliveryTime: string;
  localTimeHHmm: string;
  quietHoursActive: boolean;
  dailyDeliveryReached: boolean;
  evaluatedAt: string;
  scheduler: false;
  clockKind: 'preference-clock';
};

export type NotificationRoutingView = {
  workspaceId: string;
  userId: string;
  masterEnabled: boolean;
  typeRouting: readonly TypeRoutingView[];
  channels: readonly NotificationChannelView[];
  telegram: TelegramConnectionStatusView;
  scheduleClock: PreferenceClockView;
  deferredChannelsActivated: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationSettingsView = {
  preferences: NotificationPreferencesView;
  channels: readonly NotificationChannelView[];
  telegram: TelegramConnectionStatusView;
  routing: NotificationRoutingView;
  scheduleClock: PreferenceClockView;
  deferredChannelsActivated: false;
  generatesReports: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type DeliveryAttemptView = {
  channelId: NotificationChannelId;
  outcome: DeliveryOutcome;
  skipReason: DeliverySkipReason | null;
  detail: string | null;
};

export type NotificationDeliveryListItemView = {
  deliveryId: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  reportRunId: string | null;
  outcome: DeliveryOutcome;
  skipReasons: readonly DeliverySkipReason[];
  createdAt: string;
  authorityClass: 'notification-projection';
  generatesReports: false;
};

export type NotificationDeliveryPageView = {
  items: NotificationDeliveryListItemView[];
  authorityClass: 'notification-projection';
  generatesReports: false;
};

export type NotificationDeliveryDetailView = NotificationDeliveryListItemView & {
  attempts: readonly DeliveryAttemptView[];
  channelDelivery: ChannelDeliveryView;
  telegram: TelegramConnectionStatusView;
};

export type ListNotificationDeliveriesQuery = Readonly<{
  workspaceId: string;
  userId?: string;
  reportRunId?: string;
  type?: string;
  outcome?: string;
  q?: string;
  limit?: number;
}>;

export type UpsertNotificationPreferencesInput = Readonly<{
  workspaceId: string;
  userId: string;
  enabled?: boolean;
  channels?: Partial<UserNotificationPreferences['channels']>;
  typeRouting?: Partial<Record<NotificationType, Partial<TypeDeliveryPreference>>>;
  schedule?: Partial<{
    dailyDeliveryTime: string;
    timezone: string;
    quietHours: QuietHours | null;
    criticalBypassQuietHours: boolean;
  }>;
}>;

export function toChannelView(channel: NotificationChannelDescriptor): NotificationChannelView {
  return {
    channelId: channel.channelId,
    status: channel.status,
    label: channel.label,
    offered: channel.status === 'active',
    authorityClass: 'notification-projection',
  };
}

export function toChannelPageView(
  channels: readonly NotificationChannelDescriptor[],
): NotificationChannelPageView {
  return {
    items: channels.map(toChannelView),
    deferredChannelsActivated: false,
    authorityClass: 'notification-projection',
  };
}

export function toTelegramStatusView(connection: TelegramConnection): TelegramConnectionStatusView {
  return {
    status: connection.status,
    connected: connection.status === 'connected' && Boolean(connection.chatId),
    chatBound: Boolean(connection.chatId),
    connectedAt: connection.connectedAt ?? null,
    updatedAt: connection.updatedAt,
    connectAvailable: false,
    testAvailable: false,
    controlPlane: false,
    transport: 'in-memory',
  };
}

export function toPreferenceClockView(
  prefs: UserNotificationPreferences,
  evaluatedAt: string,
): PreferenceClockView {
  const localTimeHHmm = extractLocalTimeHHmm(evaluatedAt, prefs.schedule.timezone);
  const quietHoursActive = prefs.schedule.quietHours
    ? isWithinQuietHours(localTimeHHmm, prefs.schedule.quietHours)
    : false;
  return {
    timezone: prefs.schedule.timezone,
    dailyDeliveryTime: prefs.schedule.dailyDeliveryTime,
    localTimeHHmm,
    quietHoursActive,
    dailyDeliveryReached: localTimeHHmm >= prefs.schedule.dailyDeliveryTime,
    evaluatedAt,
    scheduler: false,
    clockKind: 'preference-clock',
  };
}

export function toTypeRoutingView(
  type: NotificationType,
  pref: TypeDeliveryPreference,
  routes: readonly RoutedChannel[],
): TypeRoutingView {
  return {
    type,
    enabled: pref.enabled,
    channels: [...pref.channels],
    critical: pref.critical === true,
    currentRoutes: routes,
  };
}

export function toPreferencesView(
  prefs: UserNotificationPreferences,
  telegramConnected: boolean,
  evaluatedAt: string,
): NotificationPreferencesView {
  return {
    workspaceId: prefs.workspaceId,
    userId: prefs.userId,
    enabled: prefs.enabled,
    channels: { ...prefs.channels },
    typeRouting: NOTIFICATION_TYPES.map((type) =>
      toTypeRoutingView(
        type,
        prefs.typeRouting[type]!,
        resolveDeliveryRoutes(
          {
            workspaceId: prefs.workspaceId,
            userId: prefs.userId,
            type,
            subject: 'routing-preview',
            body: 'Existing routing evaluation. Does not send.',
            requestedAt: evaluatedAt,
          },
          prefs,
          { telegramConnected },
        ),
      ),
    ),
    schedule: {
      dailyDeliveryTime: prefs.schedule.dailyDeliveryTime,
      timezone: prefs.schedule.timezone,
      quietHours: prefs.schedule.quietHours
        ? { start: prefs.schedule.quietHours.start, end: prefs.schedule.quietHours.end }
        : null,
      criticalBypassQuietHours: prefs.schedule.criticalBypassQuietHours,
    },
    updatedAt: prefs.updatedAt,
    authorityClass: 'notification-projection',
    generatesReports: false,
    controlPlane: false,
  };
}

export function toRoutingView(input: {
  prefs: UserNotificationPreferences;
  channels: readonly NotificationChannelDescriptor[];
  connection: TelegramConnection;
  evaluatedAt: string;
}): NotificationRoutingView {
  const telegramConnected =
    input.connection.status === 'connected' && Boolean(input.connection.chatId);
  const preferences = toPreferencesView(input.prefs, telegramConnected, input.evaluatedAt);
  return {
    workspaceId: input.prefs.workspaceId,
    userId: input.prefs.userId,
    masterEnabled: input.prefs.enabled,
    typeRouting: preferences.typeRouting,
    channels: input.channels.map(toChannelView),
    telegram: toTelegramStatusView(input.connection),
    scheduleClock: toPreferenceClockView(input.prefs, input.evaluatedAt),
    deferredChannelsActivated: false,
    controlPlane: false,
    authorityClass: 'notification-projection',
  };
}

export function toSettingsView(input: {
  prefs: UserNotificationPreferences;
  channels: readonly NotificationChannelDescriptor[];
  connection: TelegramConnection;
  evaluatedAt: string;
}): NotificationSettingsView {
  const telegramConnected =
    input.connection.status === 'connected' && Boolean(input.connection.chatId);
  const preferences = toPreferencesView(input.prefs, telegramConnected, input.evaluatedAt);
  const routing = toRoutingView(input);
  return {
    preferences,
    channels: input.channels.map(toChannelView),
    telegram: toTelegramStatusView(input.connection),
    routing,
    scheduleClock: routing.scheduleClock,
    deferredChannelsActivated: false,
    generatesReports: false,
    controlPlane: false,
    authorityClass: 'notification-projection',
  };
}

export function toDeliveryListItemView(delivery: DeliveryResult): NotificationDeliveryListItemView {
  const skipReasons = delivery.attempts
    .map((attempt) => attempt.skipReason)
    .filter((reason): reason is DeliverySkipReason => Boolean(reason));
  return {
    deliveryId: delivery.deliveryId,
    workspaceId: delivery.workspaceId,
    userId: delivery.userId,
    type: delivery.type,
    reportRunId: delivery.reportRunId ?? null,
    outcome: delivery.outcome,
    skipReasons,
    createdAt: delivery.createdAt,
    authorityClass: 'notification-projection',
    generatesReports: false,
  };
}

export function toDeliveryPageView(items: readonly DeliveryResult[]): NotificationDeliveryPageView {
  return {
    items: items.map(toDeliveryListItemView),
    authorityClass: 'notification-projection',
    generatesReports: false,
  };
}

export function toDeliveryDetailView(input: {
  delivery: DeliveryResult;
  connection: TelegramConnection;
  channels: readonly NotificationChannelDescriptor[];
}): NotificationDeliveryDetailView {
  return {
    ...toDeliveryListItemView(input.delivery),
    attempts: input.delivery.attempts.map((attempt) => ({
      channelId: attempt.channelId,
      outcome: attempt.outcome,
      skipReason: attempt.skipReason ?? null,
      detail: attempt.detail ?? null,
    })),
    channelDelivery: toChannelDeliveryView({
      workspaceId: input.delivery.workspaceId,
      userId: input.delivery.userId,
      delivery: input.delivery,
      connection: input.connection,
      channels: input.channels,
    }),
    telegram: toTelegramStatusView(input.connection),
  };
}

export function deliveryMatchesQuery(
  delivery: DeliveryResult,
  query: ListNotificationDeliveriesQuery,
): boolean {
  if (query.userId && delivery.userId !== query.userId) return false;
  if (query.reportRunId && delivery.reportRunId !== query.reportRunId) return false;
  if (query.type && delivery.type !== query.type) return false;
  if (query.outcome && delivery.outcome !== query.outcome) return false;
  const needle = query.q?.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    delivery.deliveryId,
    delivery.userId,
    delivery.type,
    delivery.outcome,
    delivery.reportRunId ?? '',
    ...delivery.attempts.map((attempt) => attempt.skipReason ?? ''),
    ...delivery.attempts.map((attempt) => attempt.channelId),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}
