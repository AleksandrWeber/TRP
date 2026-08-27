/**
 * W3-O01-b / W3-O02-b / W3-O02-c / W3-O02-d — Durable Notification Delivery store.
 *
 * Persists analytical history + Notification Durable Queue work items.
 * Hydrate performs integrity-gated restart recovery and records O02-d continuity outcomes.
 * Not a new SoT. Not a second Outbox. Not retry execution.
 */

import type { PrismaClient } from '@prisma/client';
import { persistOwnerStoreSnapshot } from '../../../persistence/analytical-owner-store-snapshot';
import { loadRecoverableOwnerSnapshot } from '../../../persistence/analytical-restart-recovery';
import type { DeliveryResult } from '../domain/delivery';
import type { NotificationDeliveryQueueItem } from '../domain/delivery-queue';
import {
  recordNotificationQueueRecoveryFailure,
  recordNotificationQueueRecoveryStart,
  recordNotificationQueueRecoverySuccess,
} from '../domain/notification-queue-continuity-status';
import { prepareNotificationStoreStateForRecovery } from '../domain/notification-queue-restart-recovery';
import { buildNotificationQueueRecoveryDiagnostics } from '../domain/notification-queue-restart-recovery';
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
   * W3-O02-c/d — restore owner snapshot including durable queue after normal restart.
   * Missing snapshot → empty (no fabrication). Corrupt queue → throws (fail honest).
   * Records operational continuity outcomes for W3-O02-d (never fabricates Ready).
   */
  async hydrate(): Promise<void> {
    recordNotificationQueueRecoveryStart();
    try {
      const payload = await loadRecoverableOwnerSnapshot(this.prisma, 'notification-delivery');
      if (!payload) {
        recordNotificationQueueRecoverySuccess({
          diagnostics: buildNotificationQueueRecoveryDiagnostics([]),
          reason: 'missing-snapshot-empty',
        });
        return;
      }
      const recovered = prepareNotificationStoreStateForRecovery(payload);
      this.importDurableState(recovered as NotificationStoreDurableState);
      recordNotificationQueueRecoverySuccess({
        diagnostics: buildNotificationQueueRecoveryDiagnostics(
          (recovered.queue ?? []) as NotificationDeliveryQueueItem[],
        ),
        reason: 'hydrate-ok',
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationQueueRecoveryFailure({ reason });
      throw error;
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
