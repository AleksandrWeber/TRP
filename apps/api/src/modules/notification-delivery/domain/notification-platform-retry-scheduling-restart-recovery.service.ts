import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingAnchor } from './durable-notification-platform-retry-scheduling-anchor';
import {
  recordNotificationPlatformRetrySchedulingRecoveryFailure,
  recordNotificationPlatformRetrySchedulingRecoveryStart,
  recordNotificationPlatformRetrySchedulingRecoverySuccess,
} from './notification-platform-retry-scheduling-continuity-status';
import { NotificationPlatformRetrySchedulingRecoveryStore } from './notification-platform-retry-scheduling-recovery-store';
import {
  buildNotificationPlatformRetrySchedulingRecoveryDiagnostics,
  prepareNotificationPlatformRetrySchedulingAnchorsForRecovery,
  type NotificationPlatformRetrySchedulingRecoveryDiagnostics,
} from './notification-platform-retry-scheduling-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingAnchorRepository,
} from './notification-platform-retry-scheduling-anchor.repository';

/**
 * W5-N19-c — deterministic restart recovery for durable Notification Platform Retry Scheduling anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish retry scheduling runtime, operational continuity, timing calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetrySchedulingRecoveryDiagnostics> {
    recordNotificationPlatformRetrySchedulingRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformRetrySchedulingAnchors();
      const recovered = prepareNotificationPlatformRetrySchedulingAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformRetrySchedulingRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetrySchedulingRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetrySchedulingRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    retrySchedulingAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingAnchor | null {
    return this.recoveryStore.get(workspaceId, retrySchedulingAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetrySchedulingRecoveryDiagnostics {
    return buildNotificationPlatformRetrySchedulingRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
