import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformQueueAnchor } from './domain/durable-notification-platform-queue-anchor';
import {
  recordNotificationPlatformQueueRecoveryFailure,
  recordNotificationPlatformQueueRecoveryStart,
  recordNotificationPlatformQueueRecoverySuccess,
} from './domain/notification-platform-queue-continuity-status';
import {
  buildNotificationPlatformQueueRecoveryDiagnostics,
  prepareNotificationPlatformQueueAnchorsForRecovery,
  type NotificationPlatformQueueRecoveryDiagnostics,
} from './domain/notification-platform-queue-restart-recovery';
import {
  NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY,
  type NotificationPlatformQueueAnchorRepository,
} from './domain/notification-platform-queue-anchor.repository';
import { NotificationPlatformQueueRecoveryStore } from './notification-platform-queue-recovery-store';

/**
 * W5-N08-c — deterministic restart recovery for durable Notification Platform Queue anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish platform queue execution, queue workers, retry, scheduler, or dispatcher.
 */
@Injectable()
export class NotificationPlatformQueueRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformQueueAnchorRepository,
    @Inject(NotificationPlatformQueueRecoveryStore)
    private readonly recoveryStore: NotificationPlatformQueueRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformQueueRecoveryDiagnostics> {
    recordNotificationPlatformQueueRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformQueueAnchors();
      const recovered = prepareNotificationPlatformQueueAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformQueueRecoveryDiagnostics(recovered);
      recordNotificationPlatformQueueRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformQueueRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    queueAnchorId: string,
  ): DurableNotificationPlatformQueueAnchor | null {
    return this.recoveryStore.get(workspaceId, queueAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformQueueRecoveryDiagnostics {
    return buildNotificationPlatformQueueRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
