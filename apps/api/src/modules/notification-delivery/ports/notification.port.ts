/**
 * RC-24 Epic 6 — Notification Delivery application ports.
 *
 * Delivery only. No report generation. No trading commands. No REST.
 */

import type { Role } from '../../identity/role';
import type { DeliveryResult, DeliverNotificationCommand } from '../domain/delivery';
import type { DiscordConnection } from '../domain/discord-connection';
import type { EmailConnection } from '../domain/email-connection';
import type { NotificationChannelDescriptor } from '../domain/notification-channel';
import type { PushConnection } from '../domain/push-connection';
import type { SlackConnection } from '../domain/slack-connection';
import type { TeamsConnection } from '../domain/teams-connection';
import type { TelegramConnection } from '../domain/telegram-connection';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';
import type { WebPushSubscriptionPublicView } from '../domain/web-push-subscription';

export const NOTIFICATION_SERVICE_PORT = Symbol('NOTIFICATION_SERVICE_PORT');
export const TELEGRAM_CHANNEL_ADAPTER = Symbol('TELEGRAM_CHANNEL_ADAPTER');
export const EMAIL_CHANNEL_ADAPTER = Symbol('EMAIL_CHANNEL_ADAPTER');
export const SLACK_CHANNEL_ADAPTER = Symbol('SLACK_CHANNEL_ADAPTER');
export const DISCORD_CHANNEL_ADAPTER = Symbol('DISCORD_CHANNEL_ADAPTER');
export const TEAMS_CHANNEL_ADAPTER = Symbol('TEAMS_CHANNEL_ADAPTER');
export const PUSH_CHANNEL_ADAPTER = Symbol('PUSH_CHANNEL_ADAPTER');

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
  actorUserId?: string;
  actorRole?: Role;
}>;

export type EmailBindRequest = Readonly<{
  workspaceId: string;
  userId: string;
  recipient: string;
  requestedAt?: string;
}>;

export type EmailDisconnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type SendTestEmailNotificationRequest = SendTestNotificationRequest;

export type SlackBindRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type SlackDisconnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type SendTestSlackNotificationRequest = SendTestNotificationRequest;

export type DiscordBindRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type DiscordDisconnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type SendTestDiscordNotificationRequest = SendTestNotificationRequest;

export type TeamsBindRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type TeamsDisconnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type SendTestTeamsNotificationRequest = SendTestNotificationRequest;

export type PushBindRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type PushDisconnectRequest = Readonly<{
  workspaceId: string;
  userId: string;
  requestedAt?: string;
}>;

export type SendTestPushNotificationRequest = SendTestNotificationRequest;

export type RegisterPushSubscriptionRequest = Readonly<{
  workspaceId: string;
  userId: string;
  endpoint: string;
  keys: Readonly<{ p256dh: string; auth: string }>;
  expirationTime?: number | null;
  userAgent?: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type RevokePushSubscriptionRequest = Readonly<{
  workspaceId: string;
  userId: string;
  subscriptionId: string;
}>;

export type NotificationChannelSendCommand = Readonly<{
  chatId: string;
  subject: string;
  body: string;
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type ListDeliveriesQuery = Readonly<{
  workspaceId: string;
  userId?: string;
  reportRunId?: string;
}>;

/**
 * Notification Service port — delivery routing + preferences + Telegram/Email workflows.
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
  /**
   * REM-02 — Observe Telegram /start via on-demand getUpdates and bind chat.id.
   * Chat id is never supplied by the client.
   */
  observePendingTelegramBind(cmd: {
    workspaceId: string;
    userId: string;
    actorUserId?: string;
    actorRole?: Role;
    completedAt?: string;
  }): Promise<TelegramConnection>;
  verifyTelegramConnection(cmd: TelegramVerifyRequest): TelegramConnection;
  disconnectTelegram(cmd: TelegramDisconnectRequest): TelegramConnection;
  sendTestNotification(cmd: SendTestNotificationRequest): Promise<DeliveryResult>;
  getEmailConnection(workspaceId: string, userId: string): EmailConnection;
  bindEmailRecipient(cmd: EmailBindRequest): EmailConnection;
  disconnectEmail(cmd: EmailDisconnectRequest): EmailConnection;
  sendTestEmailNotification(cmd: SendTestEmailNotificationRequest): Promise<DeliveryResult>;
  getSlackConnection(workspaceId: string, userId: string): SlackConnection;
  bindSlackChannel(cmd: SlackBindRequest): Promise<SlackConnection>;
  disconnectSlack(cmd: SlackDisconnectRequest): SlackConnection;
  sendTestSlackNotification(cmd: SendTestSlackNotificationRequest): Promise<DeliveryResult>;
  getDiscordConnection(workspaceId: string, userId: string): DiscordConnection;
  bindDiscordChannel(cmd: DiscordBindRequest): Promise<DiscordConnection>;
  disconnectDiscord(cmd: DiscordDisconnectRequest): DiscordConnection;
  sendTestDiscordNotification(cmd: SendTestDiscordNotificationRequest): Promise<DeliveryResult>;
  getTeamsConnection(workspaceId: string, userId: string): TeamsConnection;
  bindTeamsChannel(cmd: TeamsBindRequest): Promise<TeamsConnection>;
  disconnectTeams(cmd: TeamsDisconnectRequest): TeamsConnection;
  sendTestTeamsNotification(cmd: SendTestTeamsNotificationRequest): Promise<DeliveryResult>;
  getPushConnection(workspaceId: string, userId: string): PushConnection;
  bindPushChannel(cmd: PushBindRequest): Promise<PushConnection>;
  disconnectPush(cmd: PushDisconnectRequest): Promise<PushConnection>;
  sendTestPushNotification(cmd: SendTestPushNotificationRequest): Promise<DeliveryResult>;
  registerPushSubscription(
    cmd: RegisterPushSubscriptionRequest,
  ): Promise<WebPushSubscriptionPublicView>;
  revokePushSubscription(
    cmd: RevokePushSubscriptionRequest,
  ): Promise<WebPushSubscriptionPublicView | null>;
  listPushSubscriptions(
    workspaceId: string,
    userId: string,
  ): Promise<readonly WebPushSubscriptionPublicView[]>;
  getPushVapidPublicKey(cmd: {
    workspaceId: string;
    actorUserId: string;
    actorRole: Role;
  }): Promise<string | null>;
  deliver(cmd: DeliverNotificationCommand): Promise<DeliveryResult>;
  /**
   * Read-only list of already-recorded deliveries. Not a new SoT.
   * Does not send, retry, or generate reports.
   */
  listDeliveries(query: ListDeliveriesQuery): readonly DeliveryResult[];
}

/** Channel send surface (Telegram, Email, Slack, Discord, Teams, Push active). */
export interface NotificationChannelPort {
  readonly channelId: string;
  readonly active: boolean;
  send(
    cmd: NotificationChannelSendCommand,
  ): Promise<Readonly<{ ok: true } | { ok: false; detail: string }>>;
}

export const NOTIFICATION_PORTS_ACTIVE = Object.freeze({
  notificationService: true,
  telegramChannel: true,
  emailChannel: true,
  slackChannel: true,
  discordChannel: true,
  teamsChannel: true,
  pushChannel: true,
  persistence: true,
  rest: false,
} as const);
