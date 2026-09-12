import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetryBackoffAnchor } from './durable-notification-platform-retry-backoff-anchor';
import {
  recordNotificationPlatformRetryBackoffRecoveryFailure,
  recordNotificationPlatformRetryBackoffRecoveryStart,
  recordNotificationPlatformRetryBackoffRecoverySuccess,
} from './notification-platform-retry-backoff-continuity-status';
import { NotificationPlatformRetryBackoffRecoveryStore } from './notification-platform-retry-backoff-recovery-store';
import {
  buildNotificationPlatformRetryBackoffRecoveryDiagnostics,
  prepareNotificationPlatformRetryBackoffAnchorsForRecovery,
  type NotificationPlatformRetryBackoffRecoveryDiagnostics,
} from './notification-platform-retry-backoff-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryBackoffAnchorRepository,
} from './notification-platform-retry-backoff-anchor.repository';

/**
 * W5-N21-c — deterministic restart recovery for durable Notification Platform Retry Backoff anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish retry backoff runtime, operational continuity, backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetryBackoffRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryBackoffAnchorRepository,
    @Inject(NotificationPlatformRetryBackoffRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryBackoffRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetryBackoffRecoveryDiagnostics> {
    recordNotificationPlatformRetryBackoffRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformRetryBackoffAnchors();
      const recovered = prepareNotificationPlatformRetryBackoffAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformRetryBackoffRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetryBackoffRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetryBackoffRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    retryBackoffAnchorId: string,
  ): DurableNotificationPlatformRetryBackoffAnchor | null {
    return this.recoveryStore.get(workspaceId, retryBackoffAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetryBackoffRecoveryDiagnostics {
    return buildNotificationPlatformRetryBackoffRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
