/**
 * RC-24 Epic 6 — Process-local notification store.
 *
 * W3-O01-b: snapshot export/import for preferences / Telegram / DeliveryResult history.
 * W3-O02-b: same owner snapshot extended with Notification Durable Queue work items
 * (TD-045). Distinct from paper Outbox (TD-035). Persistence only — not restart recovery.
 */

import { Injectable } from '@nestjs/common';
import type { DeliveryResult } from '../domain/delivery';
import type { NotificationDeliveryQueueItem } from '../domain/delivery-queue';
import type { TelegramConnection } from '../domain/telegram-connection';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';

function key(workspaceId: string, userId: string): string {
  return `${workspaceId}::${userId}`;
}

export type NotificationStoreDurableState = Readonly<{
  preferences: UserNotificationPreferences[];
  telegram: TelegramConnection[];
  deliveries: DeliveryResult[];
  /** W3-O02-b — in-flight / pending / retryable / terminal queue work (not Outbox). */
  queue: NotificationDeliveryQueueItem[];
}>;

@Injectable()
export class InMemoryNotificationStore {
  private readonly preferences = new Map<string, UserNotificationPreferences>();
  private readonly telegram = new Map<string, TelegramConnection>();
  private readonly tokenIndex = new Map<string, string>();
  private readonly deliveries: DeliveryResult[] = [];
  private readonly queue = new Map<string, NotificationDeliveryQueueItem>();

  getPreferences(workspaceId: string, userId: string): UserNotificationPreferences | undefined {
    return this.preferences.get(key(workspaceId, userId));
  }

  savePreferences(prefs: UserNotificationPreferences): void {
    this.preferences.set(key(prefs.workspaceId, prefs.userId), prefs);
  }

  getTelegram(workspaceId: string, userId: string): TelegramConnection | undefined {
    return this.telegram.get(key(workspaceId, userId));
  }

  saveTelegram(connection: TelegramConnection): void {
    const k = key(connection.workspaceId, connection.userId);
    const previous = this.telegram.get(k);
    if (previous?.connectionToken) {
      this.tokenIndex.delete(previous.connectionToken);
    }
    this.telegram.set(k, connection);
    if (connection.connectionToken) {
      this.tokenIndex.set(connection.connectionToken, k);
    }
  }

  findTelegramByToken(connectionToken: string): TelegramConnection | undefined {
    const k = this.tokenIndex.get(connectionToken);
    if (!k) return undefined;
    return this.telegram.get(k);
  }

  recordDelivery(result: DeliveryResult): void {
    this.deliveries.push(result);
  }

  listDeliveries(): readonly DeliveryResult[] {
    return Object.freeze([...this.deliveries]);
  }

  getQueueItem(queueItemId: string): NotificationDeliveryQueueItem | undefined {
    return this.queue.get(queueItemId);
  }

  saveQueueItem(item: NotificationDeliveryQueueItem): void {
    const workspaceId = item.workspaceId.trim();
    if (!workspaceId) {
      throw new Error('Notification queue item requires workspaceId');
    }
    this.queue.set(item.queueItemId, item);
  }

  listQueueItems(query: {
    workspaceId: string;
    userId?: string;
    openOnly?: boolean;
  }): readonly NotificationDeliveryQueueItem[] {
    const workspaceId = query.workspaceId.trim();
    if (!workspaceId) {
      return Object.freeze([]);
    }
    const userId = query.userId?.trim();
    const openOnly = query.openOnly === true;
    return Object.freeze(
      [...this.queue.values()].filter((item) => {
        if (item.workspaceId !== workspaceId) return false;
        if (userId && item.userId !== userId) return false;
        if (openOnly) {
          return (
            item.status === 'pending' || item.status === 'in-flight' || item.status === 'retryable'
          );
        }
        return true;
      }),
    );
  }

  exportDurableState(): NotificationStoreDurableState {
    return Object.freeze({
      preferences: [...this.preferences.values()],
      telegram: [...this.telegram.values()],
      deliveries: [...this.deliveries],
      queue: [...this.queue.values()],
    });
  }

  importDurableState(state: NotificationStoreDurableState): void {
    this.preferences.clear();
    this.telegram.clear();
    this.tokenIndex.clear();
    this.deliveries.length = 0;
    this.queue.clear();
    for (const prefs of state.preferences ?? []) {
      this.preferences.set(key(prefs.workspaceId, prefs.userId), prefs);
    }
    for (const connection of state.telegram ?? []) {
      this.saveTelegram(connection);
    }
    for (const delivery of state.deliveries ?? []) {
      this.deliveries.push(delivery);
    }
    for (const item of state.queue ?? []) {
      this.queue.set(item.queueItemId, item);
    }
  }
}
