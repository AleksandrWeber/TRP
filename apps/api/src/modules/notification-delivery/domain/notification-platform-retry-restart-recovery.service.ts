import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetryAnchor } from './durable-notification-platform-retry-anchor';
import {
  recordNotificationPlatformRetryRecoveryFailure,
  recordNotificationPlatformRetryRecoveryStart,
  recordNotificationPlatformRetryRecoverySuccess,
} from './notification-platform-retry-continuity-status';
import { NotificationPlatformRetryRecoveryStore } from './notification-platform-retry-recovery-store';
import {
  buildNotificationPlatformRetryRecoveryDiagnostics,
  prepareNotificationPlatformRetryAnchorsForRecovery,
  type NotificationPlatformRetryRecoveryDiagnostics,
} from './notification-platform-retry-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryAnchorRepository,
} from './notification-platform-retry-anchor.repository';

/**
 * W5-N13-c — deterministic restart recovery for durable Notification Platform Retry anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish retry runtime, retry execution, retry scheduling, retry queue processing,
 * dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformRetryRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryAnchorRepository,
    @Inject(NotificationPlatformRetryRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetryRecoveryDiagnostics> {
    recordNotificationPlatformRetryRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformRetryAnchors();
      const recovered = prepareNotificationPlatformRetryAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformRetryRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetryRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetryRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    retryAnchorId: string,
  ): DurableNotificationPlatformRetryAnchor | null {
    return this.recoveryStore.get(workspaceId, retryAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetryRecoveryDiagnostics {
    return buildNotificationPlatformRetryRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
