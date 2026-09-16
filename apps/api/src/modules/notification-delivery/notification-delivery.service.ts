/**
 * RC-24 Epic 6 — Notification Delivery Service.
 *
 * Delivers completed report / ops notifications through configured channels.
 * Never generates reports. Never owns business state. Never controls runtime.
 *
 * W3-O02-b: deliver() persists queue work on this owner (pending → in-flight →
 * completed|retryable|failed). Internal queue APIs only — no REST / operator UI.
 * Restart recovery is W3-O02-c. Retry execution is out of this slice.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Role } from '../identity/role';
import { InMemoryEmailAdapter } from './adapters/in-memory-email.adapter';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryDiscordAdapter } from './adapters/in-memory-discord.adapter';
import { InMemorySlackAdapter } from './adapters/in-memory-slack.adapter';
import { DiscordWebhookCredentialResolver } from './adapters/discord-webhook-credential.resolver';
import { SlackWebhookCredentialResolver } from './adapters/slack-webhook-credential.resolver';
import { TelegramStartBindObserver } from './adapters/telegram-start-bind.observer';
import {
  createDeliveryResult,
  type ChannelDeliveryAttempt,
  type DeliverNotificationCommand,
  type DeliveryResult,
} from './domain/delivery';
import {
  createPendingNotificationQueueItem,
  withNotificationQueueStatus,
  type NotificationDeliveryQueueItem,
} from './domain/delivery-queue';
import { NOTIFICATION_CHANNEL_CATALOG } from './domain/notification-channel';
import {
  bindDiscordChannel as applyDiscordChannelBind,
  disconnectDiscordConnection,
  markDiscordWebhookFailed,
  markDiscordWebhookVerified,
  notConnectedDiscord,
  type DiscordConnection,
} from './domain/discord-connection';
import {
  bindEmailRecipient as applyEmailRecipientBind,
  disconnectEmailConnection,
  markEmailSmtpFailed,
  markEmailSmtpVerified,
  notConnectedEmail,
  type EmailConnection,
} from './domain/email-connection';
import {
  bindSlackChannel as applySlackChannelBind,
  disconnectSlackConnection,
  markSlackWebhookFailed,
  markSlackWebhookVerified,
  notConnectedSlack,
  type SlackConnection,
} from './domain/slack-connection';
import {
  bindTelegramChat,
  createPendingTelegramConnection,
  disconnectTelegramConnection,
  notConnectedTelegram,
  type TelegramConnection,
} from './domain/telegram-connection';
import {
  createUserNotificationPreferences,
  type UserNotificationPreferences,
} from './domain/user-notification-preferences';
import {
  DISCORD_CHANNEL_ADAPTER,
  EMAIL_CHANNEL_ADAPTER,
  SLACK_CHANNEL_ADAPTER,
  TELEGRAM_CHANNEL_ADAPTER,
  type DiscordBindRequest,
  type DiscordDisconnectRequest,
  type EmailBindRequest,
  type EmailDisconnectRequest,
  type NotificationChannelPort,
  type NotificationServicePort,
  type SendTestDiscordNotificationRequest,
  type SendTestEmailNotificationRequest,
  type SendTestNotificationRequest,
  type SendTestSlackNotificationRequest,
  type SlackBindRequest,
  type SlackDisconnectRequest,
  type TelegramConnectRequest,
  type TelegramConnectResult,
  type TelegramDisconnectRequest,
  type TelegramVerifyRequest,
  type UpsertNotificationPreferences,
} from './ports/notification.port';
import { resolveDeliveryRoutes } from './routing/resolve-delivery-routing';

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function nowOr(value: string | undefined): string {
  return value?.trim() || new Date().toISOString();
}

@Injectable()
export class NotificationDeliveryService implements NotificationServicePort {
  private readonly email: NotificationChannelPort;
  private readonly slack: NotificationChannelPort;
  private readonly discord: NotificationChannelPort;

  constructor(
    @Inject(InMemoryNotificationStore)
    private readonly store: InMemoryNotificationStore,
    @Inject(TELEGRAM_CHANNEL_ADAPTER)
    private readonly telegram: NotificationChannelPort,
    @Optional()
    @Inject(TelegramStartBindObserver)
    private readonly startBind?: TelegramStartBindObserver,
    @Optional()
    @Inject(EMAIL_CHANNEL_ADAPTER)
    email?: NotificationChannelPort,
    @Optional()
    @Inject(SLACK_CHANNEL_ADAPTER)
    slack?: NotificationChannelPort,
    @Optional()
    @Inject(DISCORD_CHANNEL_ADAPTER)
    discord?: NotificationChannelPort,
    @Optional()
    @Inject(SlackWebhookCredentialResolver)
    private readonly slackCredentials?: SlackWebhookCredentialResolver,
    @Optional()
    @Inject(DiscordWebhookCredentialResolver)
    private readonly discordCredentials?: DiscordWebhookCredentialResolver,
  ) {
    this.email = email ?? new InMemoryEmailAdapter();
    this.slack = slack ?? new InMemorySlackAdapter();
    this.discord = discord ?? new InMemoryDiscordAdapter();
  }

  listChannels() {
    return NOTIFICATION_CHANNEL_CATALOG;
  }

  getPreferences(workspaceId: string, userId: string): UserNotificationPreferences {
    const existing = this.store.getPreferences(workspaceId, userId);
    if (existing) return existing;
    const created = createUserNotificationPreferences({
      workspaceId,
      userId,
      updatedAt: new Date().toISOString(),
    });
    this.store.savePreferences(created);
    return created;
  }

  upsertPreferences(cmd: UpsertNotificationPreferences): UserNotificationPreferences {
    const current = this.getPreferences(cmd.workspaceId, cmd.userId);
    const next = createUserNotificationPreferences({
      workspaceId: cmd.workspaceId,
      userId: cmd.userId,
      enabled: cmd.enabled ?? current.enabled,
      channels: { ...current.channels, ...(cmd.channels ?? {}) },
      typeRouting: {
        ...current.typeRouting,
        ...(cmd.typeRouting as UpsertNotificationPreferences['typeRouting']),
      },
      schedule: { ...current.schedule, ...(cmd.schedule ?? {}) },
      updatedAt: nowOr(cmd.updatedAt),
    });
    this.store.savePreferences(next);
    return next;
  }

  getTelegramConnection(workspaceId: string, userId: string): TelegramConnection {
    const existing = this.store.getTelegram(workspaceId, userId);
    if (existing) return existing;
    const created = notConnectedTelegram(workspaceId, userId, new Date().toISOString());
    this.store.saveTelegram(created);
    return created;
  }

  connectTelegram(cmd: TelegramConnectRequest): TelegramConnectResult {
    const requestedAt = nowOr(cmd.requestedAt);
    const connectionToken = `tg-${stableHash(`${cmd.workspaceId}|${cmd.userId}|${requestedAt}`)}`;
    const connection = createPendingTelegramConnection({
      workspaceId: cmd.workspaceId,
      userId: cmd.userId,
      connectionToken,
      updatedAt: requestedAt,
    });
    this.store.saveTelegram(connection);
    return Object.freeze({
      connection,
      deepLink: `tg://connect/${connectionToken}`,
    });
  }

  completeTelegramConnect(cmd: {
    connectionToken: string;
    chatId: string;
    completedAt?: string;
  }): TelegramConnection {
    const pending = this.store.findTelegramByToken(cmd.connectionToken);
    if (!pending) {
      throw new Error('Unknown Telegram connection token');
    }
    const connected = bindTelegramChat(pending, cmd.chatId, nowOr(cmd.completedAt));
    this.store.saveTelegram(connected);
    return connected;
  }

  async observePendingTelegramBind(cmd: {
    workspaceId: string;
    userId: string;
    actorUserId?: string;
    actorRole?: Role;
    completedAt?: string;
  }): Promise<TelegramConnection> {
    const workspaceId = cmd.workspaceId.trim();
    const userId = cmd.userId.trim();
    if (!workspaceId || !userId) {
      throw new Error('Telegram connection is not awaiting bind');
    }
    const current = this.getTelegramConnection(workspaceId, userId);
    if (current.status !== 'pending' || !current.connectionToken) {
      throw new Error('Telegram connection is not awaiting bind');
    }
    if (!this.startBind) {
      throw new Error('Telegram chat has not been observed');
    }

    const observed = await this.startBind.observeStartBind({
      workspaceId,
      expectedToken: current.connectionToken,
      actorUserId: cmd.actorUserId,
      actorRole: cmd.actorRole,
    });
    if (!observed.ok) {
      throw new Error('Telegram chat has not been observed');
    }

    const pending = this.store.findTelegramByToken(current.connectionToken);
    if (
      !pending ||
      pending.workspaceId !== workspaceId ||
      pending.userId !== userId ||
      pending.connectionToken !== current.connectionToken ||
      pending.status !== 'pending'
    ) {
      throw new Error('Telegram chat has not been observed');
    }

    return this.completeTelegramConnect({
      connectionToken: current.connectionToken,
      chatId: observed.chatId,
      ...(cmd.completedAt !== undefined ? { completedAt: cmd.completedAt } : {}),
    });
  }

  verifyTelegramConnection(cmd: TelegramVerifyRequest): TelegramConnection {
    const connection = this.getTelegramConnection(cmd.workspaceId, cmd.userId);
    if (connection.status === 'connected' && connection.chatId) {
      return connection;
    }
    return connection;
  }

  disconnectTelegram(cmd: TelegramDisconnectRequest): TelegramConnection {
    const current = this.getTelegramConnection(cmd.workspaceId, cmd.userId);
    const next = disconnectTelegramConnection(current, nowOr(cmd.requestedAt));
    this.store.saveTelegram(next);
    return next;
  }

  getEmailConnection(workspaceId: string, userId: string): EmailConnection {
    const existing = this.store.getEmail(workspaceId, userId);
    if (existing) return existing;
    const created = notConnectedEmail(workspaceId, userId, new Date().toISOString());
    this.store.saveEmail(created);
    return created;
  }

  bindEmailRecipient(cmd: EmailBindRequest): EmailConnection {
    const current = this.getEmailConnection(cmd.workspaceId, cmd.userId);
    const next = applyEmailRecipientBind(current, cmd.recipient, nowOr(cmd.requestedAt));
    this.store.saveEmail(next);
    return next;
  }

  disconnectEmail(cmd: EmailDisconnectRequest): EmailConnection {
    const current = this.getEmailConnection(cmd.workspaceId, cmd.userId);
    const next = disconnectEmailConnection(current, nowOr(cmd.requestedAt));
    this.store.saveEmail(next);
    return next;
  }

  async sendTestNotification(cmd: SendTestNotificationRequest): Promise<DeliveryResult> {
    return this.deliver({
      workspaceId: cmd.workspaceId,
      userId: cmd.userId,
      type: 'daily-report',
      subject: 'Test notification',
      body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
      requestedAt: nowOr(cmd.requestedAt),
      ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
      ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
    });
  }

  async sendTestEmailNotification(cmd: SendTestEmailNotificationRequest): Promise<DeliveryResult> {
    const connection = this.getEmailConnection(cmd.workspaceId, cmd.userId);
    if (!connection.recipient) {
      throw new Error('Email recipient is not bound');
    }
    const requestedAt = nowOr(cmd.requestedAt);
    const workspaceId = cmd.workspaceId.trim();
    const queueItemId = `nq-${stableHash(
      `${workspaceId}|${cmd.userId}|daily-report|${requestedAt}|email-test|queue`,
    )}`;
    const deliveryId = `del-${stableHash(
      `${workspaceId}|${cmd.userId}|daily-report|${requestedAt}|email-test`,
    )}`;

    let queueItem = createPendingNotificationQueueItem({
      queueItemId,
      command: {
        workspaceId,
        userId: cmd.userId,
        type: 'daily-report',
        subject: 'Test notification',
        body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
        requestedAt,
        ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
        ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
      },
      createdAt: requestedAt,
    });
    this.store.saveQueueItem(queueItem);
    queueItem = withNotificationQueueStatus(queueItem, 'in-flight', { updatedAt: requestedAt });
    this.store.saveQueueItem(queueItem);

    const result = await this.email.send({
      chatId: connection.recipient,
      subject: 'Test notification',
      body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
      workspaceId,
      ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
      ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
    });

    const verifiedAt = nowOr(undefined);
    if (result.ok) {
      this.store.saveEmail(markEmailSmtpVerified(connection, verifiedAt));
    } else {
      this.store.saveEmail(markEmailSmtpFailed(connection, verifiedAt));
    }

    const attempts: ChannelDeliveryAttempt[] = [
      Object.freeze(
        result.ok
          ? { channelId: 'email' as const, outcome: 'delivered' as const }
          : {
              channelId: 'email' as const,
              outcome: 'failed' as const,
              detail: result.detail,
            },
      ),
    ];
    const delivery = createDeliveryResult({
      deliveryId,
      workspaceId,
      userId: cmd.userId,
      type: 'daily-report',
      attempts,
      createdAt: requestedAt,
    });
    this.store.recordDelivery(delivery);

    const terminalStatus = delivery.outcome === 'failed' ? 'retryable' : 'completed';
    queueItem = withNotificationQueueStatus(queueItem, terminalStatus, {
      updatedAt: verifiedAt,
      deliveryId: delivery.deliveryId,
      ...(result.ok ? {} : { detail: result.detail }),
    });
    this.store.saveQueueItem(queueItem);
    return delivery;
  }

  getSlackConnection(workspaceId: string, userId: string): SlackConnection {
    const existing = this.store.getSlack(workspaceId, userId);
    if (existing) return existing;
    const created = notConnectedSlack(workspaceId, userId, new Date().toISOString());
    this.store.saveSlack(created);
    return created;
  }

  async bindSlackChannel(cmd: SlackBindRequest): Promise<SlackConnection> {
    const configured = await this.slackCredentials?.isConfigured({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId ?? cmd.userId,
      actorRole: cmd.actorRole,
    });
    if (!configured) {
      throw new Error('Slack webhook is not configured');
    }
    const current = this.getSlackConnection(cmd.workspaceId, cmd.userId);
    const next = applySlackChannelBind(current, nowOr(cmd.requestedAt));
    this.store.saveSlack(next);
    return next;
  }

  disconnectSlack(cmd: SlackDisconnectRequest): SlackConnection {
    const current = this.getSlackConnection(cmd.workspaceId, cmd.userId);
    const next = disconnectSlackConnection(current, nowOr(cmd.requestedAt));
    this.store.saveSlack(next);
    return next;
  }

  async sendTestSlackNotification(cmd: SendTestSlackNotificationRequest): Promise<DeliveryResult> {
    const connection = this.getSlackConnection(cmd.workspaceId, cmd.userId);
    if (connection.status === 'not-connected') {
      throw new Error('Slack channel is not bound');
    }
    const requestedAt = nowOr(cmd.requestedAt);
    const workspaceId = cmd.workspaceId.trim();
    const queueItemId = `nq-${stableHash(
      `${workspaceId}|${cmd.userId}|daily-report|${requestedAt}|slack-test|queue`,
    )}`;
    const deliveryId = `del-${stableHash(
      `${workspaceId}|${cmd.userId}|daily-report|${requestedAt}|slack-test`,
    )}`;

    let queueItem = createPendingNotificationQueueItem({
      queueItemId,
      command: {
        workspaceId,
        userId: cmd.userId,
        type: 'daily-report',
        subject: 'Test notification',
        body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
        requestedAt,
        ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
        ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
      },
      createdAt: requestedAt,
    });
    this.store.saveQueueItem(queueItem);
    queueItem = withNotificationQueueStatus(queueItem, 'in-flight', { updatedAt: requestedAt });
    this.store.saveQueueItem(queueItem);

    const result = await this.slack.send({
      chatId: '',
      subject: 'Test notification',
      body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
      workspaceId,
      ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
      ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
    });

    const verifiedAt = nowOr(undefined);
    if (result.ok) {
      this.store.saveSlack(markSlackWebhookVerified(connection, verifiedAt));
    } else {
      this.store.saveSlack(markSlackWebhookFailed(connection, verifiedAt, result.detail));
    }

    const attempts: ChannelDeliveryAttempt[] = [
      Object.freeze(
        result.ok
          ? { channelId: 'slack' as const, outcome: 'delivered' as const }
          : {
              channelId: 'slack' as const,
              outcome: 'failed' as const,
              detail: result.detail,
            },
      ),
    ];
    const delivery = createDeliveryResult({
      deliveryId,
      workspaceId,
      userId: cmd.userId,
      type: 'daily-report',
      attempts,
      createdAt: requestedAt,
    });
    this.store.recordDelivery(delivery);

    const terminalStatus = delivery.outcome === 'failed' ? 'retryable' : 'completed';
    queueItem = withNotificationQueueStatus(queueItem, terminalStatus, {
      updatedAt: verifiedAt,
      deliveryId: delivery.deliveryId,
      ...(result.ok ? {} : { detail: result.detail }),
    });
    this.store.saveQueueItem(queueItem);
    return delivery;
  }

  getDiscordConnection(workspaceId: string, userId: string): DiscordConnection {
    const existing = this.store.getDiscord(workspaceId, userId);
    if (existing) return existing;
    const created = notConnectedDiscord(workspaceId, userId, new Date().toISOString());
    this.store.saveDiscord(created);
    return created;
  }

  async bindDiscordChannel(cmd: DiscordBindRequest): Promise<DiscordConnection> {
    const configured = await this.discordCredentials?.isConfigured({
      workspaceId: cmd.workspaceId,
      actorUserId: cmd.actorUserId ?? cmd.userId,
      actorRole: cmd.actorRole,
    });
    if (!configured) {
      throw new Error('Discord webhook is not configured');
    }
    const current = this.getDiscordConnection(cmd.workspaceId, cmd.userId);
    const next = applyDiscordChannelBind(current, nowOr(cmd.requestedAt));
    this.store.saveDiscord(next);
    return next;
  }

  disconnectDiscord(cmd: DiscordDisconnectRequest): DiscordConnection {
    const current = this.getDiscordConnection(cmd.workspaceId, cmd.userId);
    const next = disconnectDiscordConnection(current, nowOr(cmd.requestedAt));
    this.store.saveDiscord(next);
    return next;
  }

  async sendTestDiscordNotification(
    cmd: SendTestDiscordNotificationRequest,
  ): Promise<DeliveryResult> {
    const connection = this.getDiscordConnection(cmd.workspaceId, cmd.userId);
    if (connection.status === 'not-connected') {
      throw new Error('Discord channel is not bound');
    }
    const requestedAt = nowOr(cmd.requestedAt);
    const workspaceId = cmd.workspaceId.trim();
    const queueItemId = `nq-${stableHash(
      `${workspaceId}|${cmd.userId}|daily-report|${requestedAt}|discord-test|queue`,
    )}`;
    const deliveryId = `del-${stableHash(
      `${workspaceId}|${cmd.userId}|daily-report|${requestedAt}|discord-test`,
    )}`;

    let queueItem = createPendingNotificationQueueItem({
      queueItemId,
      command: {
        workspaceId,
        userId: cmd.userId,
        type: 'daily-report',
        subject: 'Test notification',
        body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
        requestedAt,
        ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
        ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
      },
      createdAt: requestedAt,
    });
    this.store.saveQueueItem(queueItem);
    queueItem = withNotificationQueueStatus(queueItem, 'in-flight', { updatedAt: requestedAt });
    this.store.saveQueueItem(queueItem);

    const result = await this.discord.send({
      chatId: '',
      subject: 'Test notification',
      body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
      workspaceId,
      ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
      ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
    });

    const verifiedAt = nowOr(undefined);
    if (result.ok) {
      this.store.saveDiscord(markDiscordWebhookVerified(connection, verifiedAt));
    } else {
      this.store.saveDiscord(markDiscordWebhookFailed(connection, verifiedAt, result.detail));
    }

    const attempts: ChannelDeliveryAttempt[] = [
      Object.freeze(
        result.ok
          ? { channelId: 'discord' as const, outcome: 'delivered' as const }
          : {
              channelId: 'discord' as const,
              outcome: 'failed' as const,
              detail: result.detail,
            },
      ),
    ];
    const delivery = createDeliveryResult({
      deliveryId,
      workspaceId,
      userId: cmd.userId,
      type: 'daily-report',
      attempts,
      createdAt: requestedAt,
    });
    this.store.recordDelivery(delivery);

    const terminalStatus = delivery.outcome === 'failed' ? 'retryable' : 'completed';
    queueItem = withNotificationQueueStatus(queueItem, terminalStatus, {
      updatedAt: verifiedAt,
      deliveryId: delivery.deliveryId,
      ...(result.ok ? {} : { detail: result.detail }),
    });
    this.store.saveQueueItem(queueItem);
    return delivery;
  }

  async deliver(cmd: DeliverNotificationCommand): Promise<DeliveryResult> {
    const workspaceId = cmd.workspaceId.trim();
    if (!workspaceId) {
      throw new Error('Notification delivery requires workspaceId');
    }

    const queueItemId = `nq-${stableHash(
      `${workspaceId}|${cmd.userId}|${cmd.type}|${cmd.requestedAt}|${cmd.subject}|queue`,
    )}`;
    const deliveryId = `del-${stableHash(
      `${workspaceId}|${cmd.userId}|${cmd.type}|${cmd.requestedAt}|${cmd.subject}`,
    )}`;
    const now = nowOr(cmd.requestedAt);

    let queueItem = createPendingNotificationQueueItem({
      queueItemId,
      command: { ...cmd, workspaceId },
      createdAt: now,
    });
    this.store.saveQueueItem(queueItem);

    queueItem = withNotificationQueueStatus(queueItem, 'in-flight', { updatedAt: now });
    this.store.saveQueueItem(queueItem);

    const prefs = this.getPreferences(workspaceId, cmd.userId);
    const telegram = this.getTelegramConnection(workspaceId, cmd.userId);
    const email = this.getEmailConnection(workspaceId, cmd.userId);
    const slack = this.getSlackConnection(workspaceId, cmd.userId);
    const discord = this.getDiscordConnection(workspaceId, cmd.userId);
    const routes = resolveDeliveryRoutes({ ...cmd, workspaceId }, prefs, {
      telegramConnected: telegram.status === 'connected' && Boolean(telegram.chatId),
      emailConnected: email.status === 'connected' && Boolean(email.recipient),
      slackConnected: slack.status === 'connected',
      discordConnected: discord.status === 'connected',
    });

    const attempts: ChannelDeliveryAttempt[] = [];
    for (const route of routes) {
      if (route.skipReason) {
        attempts.push(
          Object.freeze({
            channelId: route.channelId,
            outcome: 'skipped',
            skipReason: route.skipReason,
          }),
        );
        continue;
      }

      if (route.channelId === 'telegram') {
        const result = await this.telegram.send({
          chatId: telegram.chatId!,
          subject: cmd.subject,
          body: cmd.body,
          workspaceId,
          ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
          ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
        });
        attempts.push(
          Object.freeze(
            result.ok
              ? {
                  channelId: 'telegram' as const,
                  outcome: 'delivered' as const,
                }
              : {
                  channelId: 'telegram' as const,
                  outcome: 'failed' as const,
                  detail: result.detail,
                },
          ),
        );
        continue;
      }

      if (route.channelId === 'email') {
        const result = await this.email.send({
          chatId: email.recipient!,
          subject: cmd.subject,
          body: cmd.body,
          workspaceId,
          ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
          ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
        });
        attempts.push(
          Object.freeze(
            result.ok
              ? {
                  channelId: 'email' as const,
                  outcome: 'delivered' as const,
                }
              : {
                  channelId: 'email' as const,
                  outcome: 'failed' as const,
                  detail: result.detail,
                },
          ),
        );
        continue;
      }

      if (route.channelId === 'slack') {
        const result = await this.slack.send({
          chatId: '',
          subject: cmd.subject,
          body: cmd.body,
          workspaceId,
          ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
          ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
        });
        attempts.push(
          Object.freeze(
            result.ok
              ? {
                  channelId: 'slack' as const,
                  outcome: 'delivered' as const,
                }
              : {
                  channelId: 'slack' as const,
                  outcome: 'failed' as const,
                  detail: result.detail,
                },
          ),
        );
        continue;
      }

      if (route.channelId === 'discord') {
        const result = await this.discord.send({
          chatId: '',
          subject: cmd.subject,
          body: cmd.body,
          workspaceId,
          ...(cmd.actorUserId !== undefined ? { actorUserId: cmd.actorUserId } : {}),
          ...(cmd.actorRole !== undefined ? { actorRole: cmd.actorRole } : {}),
        });
        attempts.push(
          Object.freeze(
            result.ok
              ? {
                  channelId: 'discord' as const,
                  outcome: 'delivered' as const,
                }
              : {
                  channelId: 'discord' as const,
                  outcome: 'failed' as const,
                  detail: result.detail,
                },
          ),
        );
        continue;
      }

      attempts.push(
        Object.freeze({
          channelId: route.channelId,
          outcome: 'skipped',
          skipReason: 'channel-reserved',
        }),
      );
    }

    const delivery = createDeliveryResult({
      deliveryId,
      workspaceId,
      userId: cmd.userId,
      type: cmd.type,
      reportRunId: cmd.reportRunId,
      attempts,
      createdAt: cmd.requestedAt,
    });
    this.store.recordDelivery(delivery);

    const terminalStatus = delivery.outcome === 'failed' ? 'retryable' : 'completed';
    const failedAttempt = attempts.find((a) => a.outcome === 'failed');
    queueItem = withNotificationQueueStatus(queueItem, terminalStatus, {
      updatedAt: nowOr(undefined),
      deliveryId: delivery.deliveryId,
      ...(failedAttempt?.detail ? { detail: failedAttempt.detail } : {}),
    });
    this.store.saveQueueItem(queueItem);

    return delivery;
  }

  /**
   * Internal queue read — workspace-scoped. Not a product HTTP surface.
   * Does not send, retry, or recover.
   */
  listDeliveryQueue(query: {
    workspaceId: string;
    userId?: string;
    openOnly?: boolean;
  }): readonly NotificationDeliveryQueueItem[] {
    const workspaceId = query.workspaceId.trim();
    if (!workspaceId) {
      throw new Error('Notification delivery queue list requires workspaceId');
    }
    return this.store.listQueueItems({
      workspaceId,
      userId: query.userId,
      openOnly: query.openOnly,
    });
  }

  /**
   * Internal enqueue for persistence tests / future recovery (O02-c).
   * Does not execute delivery or retries.
   */
  enqueueDeliveryWork(cmd: DeliverNotificationCommand): NotificationDeliveryQueueItem {
    const workspaceId = cmd.workspaceId.trim();
    if (!workspaceId) {
      throw new Error('Notification queue enqueue requires workspaceId');
    }
    const createdAt = nowOr(cmd.requestedAt);
    const queueItemId = `nq-${stableHash(
      `${workspaceId}|${cmd.userId}|${cmd.type}|${createdAt}|${cmd.subject}|enqueue`,
    )}`;
    const item = createPendingNotificationQueueItem({
      queueItemId,
      command: { ...cmd, workspaceId, requestedAt: createdAt },
      createdAt,
    });
    this.store.saveQueueItem(item);
    return item;
  }

  /**
   * Internal status write for persistence integrity tests. Not retry execution.
   */
  saveDeliveryQueueItem(item: NotificationDeliveryQueueItem): NotificationDeliveryQueueItem {
    const workspaceId = item.workspaceId.trim();
    if (!workspaceId) {
      throw new Error('Notification queue item requires workspaceId');
    }
    this.store.saveQueueItem(item);
    return item;
  }

  /**
   * Internal recovery diagnostic — workspace-scoped open queue after hydrate.
   * Does not send, retry, or fabricate items.
   */
  listOpenDeliveryQueue(workspaceId: string): readonly NotificationDeliveryQueueItem[] {
    return this.listDeliveryQueue({ workspaceId, openOnly: true });
  }

  listDeliveries(query: {
    workspaceId: string;
    userId?: string;
    reportRunId?: string;
  }): readonly DeliveryResult[] {
    const workspaceId = query.workspaceId.trim();
    const userId = query.userId?.trim();
    const reportRunId = query.reportRunId?.trim();
    return Object.freeze(
      this.store.listDeliveries().filter((item) => {
        if (item.workspaceId !== workspaceId) return false;
        if (userId && item.userId !== userId) return false;
        if (reportRunId && item.reportRunId !== reportRunId) return false;
        return true;
      }),
    );
  }
}
