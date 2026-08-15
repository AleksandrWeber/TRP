import { Inject, Injectable } from '@nestjs/common';
import type {
  DeliverNotificationCommand,
  DeliveryResult,
} from '../notification-delivery/domain/delivery';
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import { toChannelDeliveryView, type ChannelDeliveryView } from './channel-delivery.view';

/**
 * Platform / adapter chat id for the in-memory Telegram bind.
 * Never a user-entered form field. Never Telegram Bot API.
 */
export type InMemoryTelegramBindCommand = Readonly<{
  workspaceId: string;
  userId: string;
  platformChatId: string;
  requestedAt?: string;
}>;

export type ChannelDispatchResult = Readonly<{
  connection: TelegramConnection;
  delivery: DeliveryResult | null;
  projection: ChannelDeliveryView;
}>;

/**
 * PC-15 15-e — Notification Delivery reaches existing channel adapters.
 *
 * Notification Delivery remains delivery only (`deliver()` is delegated).
 * Telegram adapter remains in-memory transport (existing connect / complete / send).
 * Reserved channels stay reserved and keep the documented skip.
 * No Bot API. No control plane. No scheduler. No retries.
 */
@Injectable()
export class NotificationChannelDispatchService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
  ) {}

  dispatch(command: DeliverNotificationCommand): ChannelDispatchResult {
    const delivery = this.notifications.deliver(command);
    return this.project(command.workspaceId, command.userId, delivery);
  }

  bindInMemoryTelegram(command: InMemoryTelegramBindCommand): TelegramConnection {
    const workspaceId = command.workspaceId.trim();
    const userId = command.userId.trim();
    const platformChatId = command.platformChatId.trim();
    if (!workspaceId || !userId || !platformChatId) {
      return this.notifications.getTelegramConnection(command.workspaceId, command.userId);
    }

    const current = this.notifications.getTelegramConnection(workspaceId, userId);
    if (current.status === 'connected' && current.chatId) {
      return current;
    }

    const pending =
      current.status === 'pending' && current.connectionToken
        ? current
        : this.notifications.connectTelegram({
            workspaceId,
            userId,
            ...(command.requestedAt !== undefined ? { requestedAt: command.requestedAt } : {}),
          }).connection;

    return this.notifications.completeTelegramConnect({
      connectionToken: pending.connectionToken!,
      chatId: platformChatId,
      ...(command.requestedAt !== undefined ? { completedAt: command.requestedAt } : {}),
    });
  }

  bindAndDispatch(
    bind: InMemoryTelegramBindCommand,
    command: DeliverNotificationCommand,
  ): ChannelDispatchResult {
    if (
      bind.workspaceId.trim() !== command.workspaceId.trim() ||
      bind.userId.trim() !== command.userId.trim()
    ) {
      return this.project(
        command.workspaceId,
        command.userId,
        null,
        this.notifications.getTelegramConnection(command.workspaceId, command.userId),
      );
    }
    this.bindInMemoryTelegram(bind);
    return this.dispatch(command);
  }

  private project(
    workspaceId: string,
    userId: string,
    delivery: DeliveryResult | null,
    connection?: TelegramConnection,
  ): ChannelDispatchResult {
    const current = connection ?? this.notifications.getTelegramConnection(workspaceId, userId);
    return Object.freeze({
      connection: current,
      delivery,
      projection: toChannelDeliveryView({
        workspaceId,
        userId,
        delivery,
        connection: current,
        channels: this.notifications.listChannels(),
      }),
    });
  }
}
