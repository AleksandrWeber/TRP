/**
 * W3-O01-b — Durable Notification Delivery store on the existing owner.
 * Not W3-O02 queue. Not a new SoT.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import type { DeliveryResult } from '../domain/delivery';
import type { TelegramConnection } from '../domain/telegram-connection';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';
import {
  InMemoryNotificationStore,
  type NotificationStoreDurableState,
} from './in-memory-notification-store';

export class DurableNotificationStore extends InMemoryNotificationStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'notification-delivery');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as NotificationStoreDurableState);
    }
  }

  override savePreferences(prefs: UserNotificationPreferences): void {
    super.savePreferences(prefs);
    this.persist();
  }

  override saveTelegram(connection: TelegramConnection): void {
    super.saveTelegram(connection);
    this.persist();
  }

  override recordDelivery(result: DeliveryResult): void {
    super.recordDelivery(result);
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'notification-delivery', this.exportDurableState());
  }
}
