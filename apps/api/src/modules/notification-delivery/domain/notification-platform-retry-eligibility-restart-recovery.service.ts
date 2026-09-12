import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetryEligibilityAnchor } from './durable-notification-platform-retry-eligibility-anchor';
import {
  recordNotificationPlatformRetryEligibilityRecoveryFailure,
  recordNotificationPlatformRetryEligibilityRecoveryStart,
  recordNotificationPlatformRetryEligibilityRecoverySuccess,
} from './notification-platform-retry-eligibility-continuity-status';
import { NotificationPlatformRetryEligibilityRecoveryStore } from './notification-platform-retry-eligibility-recovery-store';
import {
  buildNotificationPlatformRetryEligibilityRecoveryDiagnostics,
  prepareNotificationPlatformRetryEligibilityAnchorsForRecovery,
  type NotificationPlatformRetryEligibilityRecoveryDiagnostics,
} from './notification-platform-retry-eligibility-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryEligibilityAnchorRepository,
} from './notification-platform-retry-eligibility-anchor.repository';

/**
 * W5-N23-c — deterministic restart recovery for durable Notification Platform Retry
 * Eligibility anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish eligibility evaluation, operational continuity, scheduling, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetryEligibilityRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryEligibilityAnchorRepository,
    @Inject(NotificationPlatformRetryEligibilityRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryEligibilityRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetryEligibilityRecoveryDiagnostics> {
    recordNotificationPlatformRetryEligibilityRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformRetryEligibilityAnchors();
      const recovered = prepareNotificationPlatformRetryEligibilityAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformRetryEligibilityRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetryEligibilityRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetryEligibilityRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    eligibilityAnchorId: string,
  ): DurableNotificationPlatformRetryEligibilityAnchor | null {
    return this.recoveryStore.get(workspaceId, eligibilityAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetryEligibilityRecoveryDiagnostics {
    return buildNotificationPlatformRetryEligibilityRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
