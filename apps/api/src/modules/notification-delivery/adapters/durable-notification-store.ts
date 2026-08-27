/**
 * W3-O01-b / W3-O02-b — Durable Notification Delivery store on the existing owner.
 *
 * Persists analytical history (O01) and Notification Durable Queue work items (O02-b)
 * in the same notification-delivery owner snapshot.
 * Not a new SoT. Not a second Outbox (TD-035). Not restart recovery (O02-c).
 */

import type { PrismaClient } from '@prisma/client';
import { persistOwnerStoreSnapshot } from '../../../persistence/analytical-owner-store-snapshot';
import { loadRecoverableOwnerSnapshot } from '../../../persistence/analytical-restart-recovery';
import type { DeliveryResult } from '../domain/delivery';
import type { NotificationDeliveryQueueItem } from '../domain/delivery-queue';
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
    const payload = await loadRecoverableOwnerSnapshot(this.prisma, 'notification-delivery');
    if (payload) {
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

  override saveQueueItem(item: NotificationDeliveryQueueItem): void {
    super.saveQueueItem(item);
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'notification-delivery', this.exportDurableState());
  }
}
