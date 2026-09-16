/**
 * PC-06 / PC-07 — product adapter over existing NotificationServicePort.
 *
 * Delegates queries, preference upserts, and channel catalog views.
 * Does not deliver, connect Telegram, send tests, or generate reports.
 * Notification Delivery remains owner. Reserved channels stay reserved.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  DISCORD_CHANNEL_ADAPTER,
  EMAIL_CHANNEL_ADAPTER,
  NOTIFICATION_SERVICE_PORT,
  SLACK_CHANNEL_ADAPTER,
  TEAMS_CHANNEL_ADAPTER,
  TELEGRAM_CHANNEL_ADAPTER,
  type NotificationChannelPort,
  type NotificationServicePort,
  type UpsertNotificationPreferences,
} from '../notification-delivery/ports/notification.port';
import { projectDiscordTransport } from '../notification-delivery/domain/discord-transport-projection';
import { projectTelegramTransport } from '../notification-delivery/domain/telegram-transport-projection';
import { projectEmailTransport } from '../notification-delivery/domain/email-transport-projection';
import { projectSlackTransport } from '../notification-delivery/domain/slack-transport-projection';
import { projectTeamsTransport } from '../notification-delivery/domain/teams-transport-projection';
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
    @Inject(TELEGRAM_CHANNEL_ADAPTER)
    private readonly telegramChannel: NotificationChannelPort,
    @Optional()
    @Inject(EMAIL_CHANNEL_ADAPTER)
    private readonly emailChannel?: NotificationChannelPort,
    @Optional()
    @Inject(SLACK_CHANNEL_ADAPTER)
    private readonly slackChannel?: NotificationChannelPort,
    @Optional()
    @Inject(DISCORD_CHANNEL_ADAPTER)
    private readonly discordChannel?: NotificationChannelPort,
    @Optional()
    @Inject(TEAMS_CHANNEL_ADAPTER)
    private readonly teamsChannel?: NotificationChannelPort,
  ) {}

  private telegramHonesty() {
    return projectTelegramTransport(this.telegramChannel);
  }

  private emailHonesty() {
    return this.emailChannel
      ? projectEmailTransport(this.emailChannel)
      : { transport: 'in-memory' as const, smtpUsed: false };
  }

  private slackHonesty() {
    return this.slackChannel
      ? projectSlackTransport(this.slackChannel)
      : { transport: 'in-memory' as const, webhookUsed: false };
  }

  private discordHonesty() {
    return this.discordChannel
      ? projectDiscordTransport(this.discordChannel)
      : { transport: 'in-memory' as const, webhookUsed: false };
  }

  private teamsHonesty() {
    return this.teamsChannel
      ? projectTeamsTransport(this.teamsChannel)
      : { transport: 'in-memory' as const, webhookUsed: false };
  }

  private emailConnection(workspaceId: string, userId: string) {
    return this.notifications.getEmailConnection?.(workspaceId, userId);
  }

  private slackConnection(workspaceId: string, userId: string) {
    return this.notifications.getSlackConnection?.(workspaceId, userId);
  }

  private discordConnection(workspaceId: string, userId: string) {
    return this.notifications.getDiscordConnection?.(workspaceId, userId);
  }

  private teamsConnection(workspaceId: string, userId: string) {
    return this.notifications.getTeamsConnection?.(workspaceId, userId);
  }

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
      honesty: this.telegramHonesty(),
      emailConnection: this.emailConnection(workspaceId, userId),
      slackConnection: this.slackConnection(workspaceId, userId),
      discordConnection: this.discordConnection(workspaceId, userId),
      teamsConnection: this.teamsConnection(workspaceId, userId),
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
      honesty: this.telegramHonesty(),
      emailConnection: this.emailConnection(workspaceId, userId),
      slackConnection: this.slackConnection(workspaceId, userId),
      discordConnection: this.discordConnection(workspaceId, userId),
      teamsConnection: this.teamsConnection(workspaceId, userId),
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
      honesty: this.telegramHonesty(),
      emailConnection: this.emailConnection(workspaceId, userId),
      emailHonesty: this.emailHonesty(),
      slackConnection: this.slackConnection(workspaceId, userId),
      slackHonesty: this.slackHonesty(),
      discordConnection: this.discordConnection(workspaceId, userId),
      discordHonesty: this.discordHonesty(),
      teamsConnection: this.teamsConnection(workspaceId, userId),
      teamsHonesty: this.teamsHonesty(),
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
      honesty: this.telegramHonesty(),
      emailConnection: this.emailConnection(workspaceId, userId),
      emailHonesty: this.emailHonesty(),
      slackConnection: this.slackConnection(workspaceId, userId),
      slackHonesty: this.slackHonesty(),
      discordConnection: this.discordConnection(workspaceId, userId),
      discordHonesty: this.discordHonesty(),
      teamsConnection: this.teamsConnection(workspaceId, userId),
      teamsHonesty: this.teamsHonesty(),
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
      honesty: this.telegramHonesty(),
      emailConnection: this.emailConnection(workspaceId, userId),
      slackConnection: this.slackConnection(workspaceId, userId),
      discordConnection: this.discordConnection(workspaceId, userId),
      teamsConnection: this.teamsConnection(workspaceId, userId),
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
      honesty: this.telegramHonesty(),
      emailConnection: this.emailConnection(input.workspaceId, input.userId),
      slackConnection: this.slackConnection(input.workspaceId, input.userId),
      discordConnection: this.discordConnection(input.workspaceId, input.userId),
      teamsConnection: this.teamsConnection(input.workspaceId, input.userId),
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
      honesty: this.telegramHonesty(),
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
