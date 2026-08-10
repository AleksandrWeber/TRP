/**
 * RC-24 Epic 6 — Notification Delivery Service.
 *
 * Delivers completed report / ops notifications through configured channels.
 * Never generates reports. Never owns business state. Never controls runtime.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import {
  createDeliveryResult,
  type ChannelDeliveryAttempt,
  type DeliverNotificationCommand,
  type DeliveryResult,
} from './domain/delivery';
import { NOTIFICATION_CHANNEL_CATALOG } from './domain/notification-channel';
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
  TELEGRAM_CHANNEL_ADAPTER,
  type NotificationServicePort,
  type SendTestNotificationRequest,
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
  constructor(
    @Inject(InMemoryNotificationStore)
    private readonly store: InMemoryNotificationStore,
    @Inject(TELEGRAM_CHANNEL_ADAPTER)
    private readonly telegram: InMemoryTelegramAdapter,
  ) {}

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

  sendTestNotification(cmd: SendTestNotificationRequest): DeliveryResult {
    return this.deliver({
      workspaceId: cmd.workspaceId,
      userId: cmd.userId,
      type: 'daily-report',
      subject: 'Test notification',
      body: 'TRP notification delivery test. Delivery channel only — not a trading command.',
      requestedAt: nowOr(cmd.requestedAt),
    });
  }

  deliver(cmd: DeliverNotificationCommand): DeliveryResult {
    const prefs = this.getPreferences(cmd.workspaceId, cmd.userId);
    const telegram = this.getTelegramConnection(cmd.workspaceId, cmd.userId);
    const routes = resolveDeliveryRoutes(cmd, prefs, {
      telegramConnected: telegram.status === 'connected' && Boolean(telegram.chatId),
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
        const result = this.telegram.send({
          chatId: telegram.chatId!,
          subject: cmd.subject,
          body: cmd.body,
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

      attempts.push(
        Object.freeze({
          channelId: route.channelId,
          outcome: 'skipped',
          skipReason: 'channel-reserved',
        }),
      );
    }

    const delivery = createDeliveryResult({
      deliveryId: `del-${stableHash(
        `${cmd.workspaceId}|${cmd.userId}|${cmd.type}|${cmd.requestedAt}|${cmd.subject}`,
      )}`,
      workspaceId: cmd.workspaceId,
      userId: cmd.userId,
      type: cmd.type,
      reportRunId: cmd.reportRunId,
      attempts,
      createdAt: cmd.requestedAt,
    });
    this.store.recordDelivery(delivery);
    return delivery;
  }
}
