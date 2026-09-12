import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetryPolicyAnchor } from './durable-notification-platform-retry-policy-anchor';
import {
  recordNotificationPlatformRetryPolicyRecoveryFailure,
  recordNotificationPlatformRetryPolicyRecoveryStart,
  recordNotificationPlatformRetryPolicyRecoverySuccess,
} from './notification-platform-retry-policy-continuity-status';
import { NotificationPlatformRetryPolicyRecoveryStore } from './notification-platform-retry-policy-recovery-store';
import {
  buildNotificationPlatformRetryPolicyRecoveryDiagnostics,
  prepareNotificationPlatformRetryPolicyAnchorsForRecovery,
  type NotificationPlatformRetryPolicyRecoveryDiagnostics,
} from './notification-platform-retry-policy-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryPolicyAnchorRepository,
} from './notification-platform-retry-policy-anchor.repository';

/**
 * W5-N20-c — deterministic restart recovery for durable Notification Platform Retry Policy anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish retry policy runtime, operational continuity, backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetryPolicyRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryPolicyAnchorRepository,
    @Inject(NotificationPlatformRetryPolicyRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryPolicyRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetryPolicyRecoveryDiagnostics> {
    recordNotificationPlatformRetryPolicyRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformRetryPolicyAnchors();
      const recovered = prepareNotificationPlatformRetryPolicyAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformRetryPolicyRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetryPolicyRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetryPolicyRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    retryPolicyAnchorId: string,
  ): DurableNotificationPlatformRetryPolicyAnchor | null {
    return this.recoveryStore.get(workspaceId, retryPolicyAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetryPolicyRecoveryDiagnostics {
    return buildNotificationPlatformRetryPolicyRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
