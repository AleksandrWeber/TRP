/**
 * PC-06 / PC-07 — product adapter over existing NotificationServicePort.
 *
 * Delegates queries, preference upserts, and channel catalog views.
 * Does not deliver, connect Telegram, send tests, or generate reports.
 * Notification Delivery remains owner. Reserved channels stay reserved.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
  type UpsertNotificationPreferences,
} from '../notification-delivery/ports/notification.port';
import type { NotificationChannelId } from '../notification-delivery/domain/notification-channel';
import type { UserNotificationPreferences } from '../notification-delivery/domain/user-notification-preferences';
import {
  channelDeliveryMatches,
  toChannelDeliveryPageView,
  toChannelDetailView,
  toChannelsWorkspaceView,
} from './notification-channel.view';
import {
  deliveryMatchesQuery,
  toChannelPageView,
  toDeliveryDetailView,
  toDeliveryPageView,
  toRoutingView,
  toSettingsView,
  type ListNotificationDeliveriesQuery,
  type NotificationChannelPageView,
  type NotificationDeliveryDetailView,
  type NotificationDeliveryPageView,
  type NotificationRoutingView,
  type NotificationSettingsView,
  type UpsertNotificationPreferencesInput,
} from './notification.view';

@Injectable()
export class NotificationProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
  ) {}

  getSettings(
    workspaceId: string,
    userId: string,
    evaluatedAt = new Date().toISOString(),
  ): NotificationSettingsView {
    return toSettingsView({
      prefs: this.notifications.getPreferences(workspaceId, userId),
      channels: this.notifications.listChannels(),
      connection: this.notifications.getTelegramConnection(workspaceId, userId),
      evaluatedAt,
    });
  }

  getRouting(
    workspaceId: string,
    userId: string,
    evaluatedAt = new Date().toISOString(),
  ): NotificationRoutingView {
    return toRoutingView({
      prefs: this.notifications.getPreferences(workspaceId, userId),
      channels: this.notifications.listChannels(),
      connection: this.notifications.getTelegramConnection(workspaceId, userId),
      evaluatedAt,
    });
  }

  listChannels(): NotificationChannelPageView {
    return toChannelPageView(this.notifications.listChannels());
  }

  getChannelsWorkspace(
    workspaceId: string,
    userId: string,
    evaluatedAt = new Date().toISOString(),
  ) {
    return toChannelsWorkspaceView({
      prefs: this.notifications.getPreferences(workspaceId, userId),
      channels: this.notifications.listChannels(),
      connection: this.notifications.getTelegramConnection(workspaceId, userId),
      evaluatedAt,
    });
  }

  getChannel(
    workspaceId: string,
    userId: string,
    channelId: NotificationChannelId,
    evaluatedAt = new Date().toISOString(),
  ) {
    return toChannelDetailView({
      channelId,
      prefs: this.notifications.getPreferences(workspaceId, userId),
      channels: this.notifications.listChannels(),
      connection: this.notifications.getTelegramConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
      evaluatedAt,
    });
  }

  getChannelDiagnostics(workspaceId: string, userId: string, channelId: NotificationChannelId) {
    return this.getChannel(workspaceId, userId, channelId)?.diagnostics ?? null;
  }

  listChannelDeliveries(
    query: ListNotificationDeliveriesQuery & { channelId: NotificationChannelId },
  ) {
    const listed = this.notifications.listDeliveries({
      workspaceId: query.workspaceId,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.reportRunId ? { reportRunId: query.reportRunId } : {}),
    });
    const filtered = [...listed]
      .filter((item) => channelDeliveryMatches(item, query.channelId, query))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const limit = query.limit !== undefined && query.limit >= 0 ? query.limit : filtered.length;
    return toChannelDeliveryPageView(filtered.slice(0, limit));
  }

  getPreferences(workspaceId: string, userId: string, evaluatedAt = new Date().toISOString()) {
    const connection = this.notifications.getTelegramConnection(workspaceId, userId);
    return toSettingsView({
      prefs: this.notifications.getPreferences(workspaceId, userId),
      channels: this.notifications.listChannels(),
      connection,
      evaluatedAt,
    }).preferences;
  }

  upsertPreferences(input: UpsertNotificationPreferencesInput) {
    const current = this.notifications.getPreferences(input.workspaceId, input.userId);
    const next = this.notifications.upsertPreferences(toUpsertCommand(input, current));
    const connection = this.notifications.getTelegramConnection(input.workspaceId, input.userId);
    return toSettingsView({
      prefs: next,
      channels: this.notifications.listChannels(),
      connection,
      evaluatedAt: next.updatedAt,
    }).preferences;
  }

  listDeliveries(query: ListNotificationDeliveriesQuery): NotificationDeliveryPageView {
    const listed = this.notifications.listDeliveries({
      workspaceId: query.workspaceId,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.reportRunId ? { reportRunId: query.reportRunId } : {}),
    });
    const filtered = [...listed]
      .filter((item) => deliveryMatchesQuery(item, query))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const limit = query.limit !== undefined && query.limit >= 0 ? query.limit : filtered.length;
    return toDeliveryPageView(filtered.slice(0, limit));
  }

  getDelivery(
    workspaceId: string,
    deliveryId: string,
    viewerUserId: string,
  ): NotificationDeliveryDetailView | null {
    const listed = this.notifications.listDeliveries({ workspaceId });
    const delivery = listed.find((item) => item.deliveryId === deliveryId);
    if (!delivery) return null;
    const connection = this.notifications.getTelegramConnection(workspaceId, viewerUserId);
    return toDeliveryDetailView({
      delivery,
      connection,
      channels: this.notifications.listChannels(),
    });
  }
}

function toUpsertCommand(
  input: UpsertNotificationPreferencesInput,
  current: UserNotificationPreferences,
): UpsertNotificationPreferences {
  const schedulePatch = input.schedule
    ? {
        ...current.schedule,
        ...(input.schedule.dailyDeliveryTime !== undefined
          ? { dailyDeliveryTime: input.schedule.dailyDeliveryTime }
          : {}),
        ...(input.schedule.timezone !== undefined ? { timezone: input.schedule.timezone } : {}),
        ...(input.schedule.criticalBypassQuietHours !== undefined
          ? { criticalBypassQuietHours: input.schedule.criticalBypassQuietHours }
          : {}),
        ...(input.schedule.quietHours === null
          ? { quietHours: undefined }
          : input.schedule.quietHours
            ? { quietHours: input.schedule.quietHours }
            : {}),
      }
    : undefined;

  return {
    workspaceId: input.workspaceId,
    userId: input.userId,
    ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    ...(input.channels ? { channels: input.channels } : {}),
    ...(input.typeRouting
      ? { typeRouting: input.typeRouting as UpsertNotificationPreferences['typeRouting'] }
      : {}),
    ...(schedulePatch ? { schedule: schedulePatch } : {}),
  };
}
