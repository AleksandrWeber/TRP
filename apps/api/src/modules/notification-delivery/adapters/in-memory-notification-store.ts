/**
 * RC-24 Epic 6 — Process-local notification store.
 *
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableNotificationStore. Distinct from W3-O02 durable delivery queue.
 */

import { Injectable } from '@nestjs/common';
import type { DeliveryResult } from '../domain/delivery';
import type { TelegramConnection } from '../domain/telegram-connection';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';

function key(workspaceId: string, userId: string): string {
  return `${workspaceId}::${userId}`;
}

export type NotificationStoreDurableState = Readonly<{
  preferences: UserNotificationPreferences[];
  telegram: TelegramConnection[];
  deliveries: DeliveryResult[];
}>;

@Injectable()
export class InMemoryNotificationStore {
  private readonly preferences = new Map<string, UserNotificationPreferences>();
  private readonly telegram = new Map<string, TelegramConnection>();
  private readonly tokenIndex = new Map<string, string>();
  private readonly deliveries: DeliveryResult[] = [];

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

  exportDurableState(): NotificationStoreDurableState {
    return Object.freeze({
      preferences: [...this.preferences.values()],
      telegram: [...this.telegram.values()],
      deliveries: [...this.deliveries],
    });
  }

  importDurableState(state: NotificationStoreDurableState): void {
    this.preferences.clear();
    this.telegram.clear();
    this.tokenIndex.clear();
    this.deliveries.length = 0;
    for (const prefs of state.preferences ?? []) {
      this.preferences.set(key(prefs.workspaceId, prefs.userId), prefs);
    }
    for (const connection of state.telegram ?? []) {
      this.saveTelegram(connection);
    }
    for (const delivery of state.deliveries ?? []) {
      this.deliveries.push(delivery);
    }
  }
}
