/**
 * RC-24 Epic 6 — Notification Delivery application ports.
 *
 * Delivery only. No report generation. No trading commands. No REST.
 */

import type { DeliveryResult, DeliverNotificationCommand } from '../domain/delivery';
import type { NotificationChannelDescriptor } from '../domain/notification-channel';
import type { TelegramConnection } from '../domain/telegram-connection';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';

export const NOTIFICATION_SERVICE_PORT = Symbol('NOTIFICATION_SERVICE_PORT');
export const TELEGRAM_CHANNEL_ADAPTER = Symbol('TELEGRAM_CHANNEL_ADAPTER');

export type UpsertNotificationPreferences = Readonly<{
  workspaceId: string;
  userId: string;
  enabled?: boolean;
  channels?: Partial<UserNotificationPreferences['channels']>;
  typeRouting?: UserNotificationPreferences['typeRouting'] extends infer T
    ? Partial<{
        [K in keyof T]: Partial<T[K]>;
      }>
    : never;
  schedule?: Partial<UserNotificationPreferences['schedule']>;
  updatedAt?: string;
}>;

export type TelegramConnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type TelegramConnectResult = Readonly<{
  connection: TelegramConnection;
  /** Deep-link style token payload; chat id is never entered by the user. */
  deepLink: string;
}>;

export type TelegramVerifyRequest = Readonly<{
  workspaceId: string;
  userId: string;
}>;

export type TelegramDisconnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type SendTestNotificationRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type ListDeliveriesQuery = Readonly<{
  workspaceId: string;
  userId?: string;
  reportRunId?: string;
}>;

/**
 * Notification Service port — delivery routing + preferences + Telegram workflow.
 */
export interface NotificationServicePort {
  listChannels(): readonly NotificationChannelDescriptor[];
  getPreferences(workspaceId: string, userId: string): UserNotificationPreferences;
  upsertPreferences(cmd: UpsertNotificationPreferences): UserNotificationPreferences;
  getTelegramConnection(workspaceId: string, userId: string): TelegramConnection;
  connectTelegram(cmd: TelegramConnectRequest): TelegramConnectResult;
  /**
   * Completes connect when Telegram adapter observes the deep-link start.
   * Chat id is supplied by the adapter / platform — never by the end user form.
   */
  completeTelegramConnect(cmd: {
    connectionToken: string;
    chatId: string;
    completedAt?: string;
  }): TelegramConnection;
  verifyTelegramConnection(cmd: TelegramVerifyRequest): TelegramConnection;
  disconnectTelegram(cmd: TelegramDisconnectRequest): TelegramConnection;
  sendTestNotification(cmd: SendTestNotificationRequest): DeliveryResult;
  deliver(cmd: DeliverNotificationCommand): DeliveryResult;
  /**
   * Read-only list of already-recorded deliveries. Not a new SoT.
   * Does not send, retry, or generate reports.
   */
  listDeliveries(query: ListDeliveriesQuery): readonly DeliveryResult[];
}

/** Channel send surface (Telegram active; reserved channels inactive). */
export interface NotificationChannelPort {
  readonly channelId: string;
  readonly active: boolean;
  send(
    cmd: Readonly<{
      chatId: string;
      subject: string;
      body: string;
    }>,
  ): Readonly<{ ok: true } | { ok: false; detail: string }>;
}

export const NOTIFICATION_PORTS_ACTIVE = Object.freeze({
  notificationService: true,
  telegramChannel: true,
  emailChannel: false,
  slackChannel: false,
  discordChannel: false,
  teamsChannel: false,
  pushChannel: false,
  persistence: true,
  rest: false,
} as const);
