import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformDeliveryAnchor } from './domain/durable-notification-platform-delivery-anchor';
import {
  recordNotificationPlatformDeliveryRecoveryFailure,
  recordNotificationPlatformDeliveryRecoveryStart,
  recordNotificationPlatformDeliveryRecoverySuccess,
} from './domain/notification-platform-delivery-continuity-status';
import {
  buildNotificationPlatformDeliveryRecoveryDiagnostics,
  prepareNotificationPlatformDeliveryAnchorsForRecovery,
  type NotificationPlatformDeliveryRecoveryDiagnostics,
} from './domain/notification-platform-delivery-restart-recovery';
import {
  NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY,
  type NotificationPlatformDeliveryAnchorRepository,
} from './domain/notification-platform-delivery-anchor.repository';
import { NotificationPlatformDeliveryRecoveryStore } from './notification-platform-delivery-recovery-store';

/**
 * W5-N06-c — deterministic restart recovery for durable Notification Platform Delivery anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish platform delivery execution, dispatcher, queue workers, retry, or scheduler.
 */
@Injectable()
export class NotificationPlatformDeliveryRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDeliveryAnchorRepository,
    @Inject(NotificationPlatformDeliveryRecoveryStore)
    private readonly recoveryStore: NotificationPlatformDeliveryRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformDeliveryRecoveryDiagnostics> {
    recordNotificationPlatformDeliveryRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformDeliveryAnchors();
      const recovered = prepareNotificationPlatformDeliveryAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformDeliveryRecoveryDiagnostics(recovered);
      recordNotificationPlatformDeliveryRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformDeliveryRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    deliveryAnchorId: string,
  ): DurableNotificationPlatformDeliveryAnchor | null {
    return this.recoveryStore.get(workspaceId, deliveryAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformDeliveryRecoveryDiagnostics {
    return buildNotificationPlatformDeliveryRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
