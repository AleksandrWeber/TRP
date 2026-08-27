/**
 * W3-O01-b / W3-O02-b / W3-O02-c — Durable Notification Delivery store on the existing owner.
 *
 * Persists analytical history (O01) and Notification Durable Queue work items (O02-b)
 * in the same notification-delivery owner snapshot.
 * Hydrate performs W3-O02-c queue restart recovery (integrity-gated) — not retry execution.
 * Not a new SoT. Not a second Outbox (TD-035).
 */

import type { PrismaClient } from '@prisma/client';
import { persistOwnerStoreSnapshot } from '../../../persistence/analytical-owner-store-snapshot';
import { loadRecoverableOwnerSnapshot } from '../../../persistence/analytical-restart-recovery';
import type { DeliveryResult } from '../domain/delivery';
import type { NotificationDeliveryQueueItem } from '../domain/delivery-queue';
import { prepareNotificationStoreStateForRecovery } from '../domain/notification-queue-restart-recovery';
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

  /**
   * W3-O02-c — restore owner snapshot including durable queue after normal restart.
   * Missing snapshot → empty (no fabrication). Corrupt queue → throws (fail honest).
   * Idempotent: re-hydrate replaces in-memory state from the same durable payload.
   */
  async hydrate(): Promise<void> {
    const payload = await loadRecoverableOwnerSnapshot(this.prisma, 'notification-delivery');
    if (!payload) {
      return;
    }
    const recovered = prepareNotificationStoreStateForRecovery(payload);
    this.importDurableState(recovered as NotificationStoreDurableState);
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
