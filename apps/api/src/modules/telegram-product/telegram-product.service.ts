/**
 * PC-07 — product adapter over existing NotificationServicePort Telegram methods.
 *
 * Delegates connect / complete / verify / disconnect / test / status.
 * Production complete observes Telegram /start; chat id is never a user field.
 * Notification Delivery remains owner. Telegram remains delivery-only.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../identity/role';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import {
  telegramDeliveryMatches,
  toTelegramConnectView,
  toTelegramConnectionView,
  toTelegramDeliveryDetailView,
  toTelegramDeliveryPageView,
  toTelegramDiagnosticsView,
  toTelegramTestView,
  type ListTelegramDeliveriesQuery,
  type TelegramConnectProductView,
  type TelegramConnectionProductView,
  type TelegramDeliveryDetailView,
  type TelegramDeliveryPageView,
  type TelegramDiagnosticsView,
  type TelegramTestProductView,
} from './telegram.view';

/**
 * Forbidden production destination. Tests may still identify this synthetic form.
 * Production complete must not bind it.
 */
export function inMemoryAdapterChatId(workspaceId: string, userId: string): string {
  return `in-memory:${workspaceId}:${userId}`;
}

@Injectable()
export class TelegramProductService {
  constructor(
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
  ) {}

  getConnection(workspaceId: string, userId: string): TelegramConnectionProductView {
    return toTelegramConnectionView(this.notifications.getTelegramConnection(workspaceId, userId));
  }

  connect(workspaceId: string, userId: string): TelegramConnectProductView {
    return toTelegramConnectView(
      this.notifications.connectTelegram({
        workspaceId,
        userId,
      }),
    );
  }

  async complete(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<TelegramConnectionProductView> {
    const current = this.notifications.getTelegramConnection(workspaceId, userId);
    if (current.status !== 'pending' || !current.connectionToken) {
      throw new Error('Telegram connection is not awaiting bind');
    }
    const connected = await this.notifications.observePendingTelegramBind({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toTelegramConnectionView(connected);
  }

  verify(workspaceId: string, userId: string): TelegramConnectionProductView {
    return toTelegramConnectionView(
      this.notifications.verifyTelegramConnection({ workspaceId, userId }),
    );
  }

  disconnect(workspaceId: string, userId: string): TelegramConnectionProductView {
    return toTelegramConnectionView(this.notifications.disconnectTelegram({ workspaceId, userId }));
  }

  async sendTest(
    workspaceId: string,
    userId: string,
    actor?: Readonly<{ userId: string; role: Role }>,
  ): Promise<TelegramTestProductView> {
    const delivery = await this.notifications.sendTestNotification({
      workspaceId,
      userId,
      ...(actor ? { actorUserId: actor.userId, actorRole: actor.role } : {}),
    });
    return toTelegramTestView({
      connection: this.notifications.getTelegramConnection(workspaceId, userId),
      delivery,
      channels: this.notifications.listChannels(),
    });
  }

  getDiagnostics(workspaceId: string, userId: string): TelegramDiagnosticsView {
    return toTelegramDiagnosticsView({
      connection: this.notifications.getTelegramConnection(workspaceId, userId),
      deliveries: this.notifications.listDeliveries({ workspaceId, userId }),
    });
  }

  listDeliveries(query: ListTelegramDeliveriesQuery): TelegramDeliveryPageView {
    const listed = this.notifications.listDeliveries({
      workspaceId: query.workspaceId,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.reportRunId ? { reportRunId: query.reportRunId } : {}),
    });
    const filtered = [...listed]
      .filter((item) => telegramDeliveryMatches(item, query))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const limit = query.limit !== undefined && query.limit >= 0 ? query.limit : filtered.length;
    return toTelegramDeliveryPageView(filtered.slice(0, limit));
  }

  getDelivery(
    workspaceId: string,
    deliveryId: string,
    viewerUserId: string,
  ): TelegramDeliveryDetailView | null {
    const listed = this.notifications.listDeliveries({ workspaceId });
    const delivery = listed.find((item) => item.deliveryId === deliveryId);
    if (!delivery) return null;
    if (!delivery.attempts.some((attempt) => attempt.channelId === 'telegram')) return null;
    return toTelegramDeliveryDetailView({
      delivery,
      connection: this.notifications.getTelegramConnection(workspaceId, viewerUserId),
      channels: this.notifications.listChannels(),
    });
  }
}
