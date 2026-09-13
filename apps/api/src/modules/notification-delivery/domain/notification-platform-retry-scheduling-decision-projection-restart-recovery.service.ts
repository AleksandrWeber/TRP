import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-anchor';
import {
  recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess,
} from './notification-platform-retry-scheduling-decision-projection-continuity-status';
import { NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore } from './notification-platform-retry-scheduling-decision-projection-recovery-store';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics,
  prepareNotificationPlatformRetrySchedulingDecisionProjectionAnchorsForRecovery,
  type NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics,
} from './notification-platform-retry-scheduling-decision-projection-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository,
} from './notification-platform-retry-scheduling-decision-projection-anchor.repository';

/**
 * W5-N27-c — deterministic restart recovery for durable Notification Platform Retry
 * Scheduling Decision anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish runtime decision projection, operational continuity, scheduling, eligibility,
 * backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics> {
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart();
    try {
      const persisted =
        await this.repository.listAllNotificationPlatformRetrySchedulingDecisionProjectionAnchors();
      const recovered =
        prepareNotificationPlatformRetrySchedulingDecisionProjectionAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics =
        buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    projectionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null {
    return this.recoveryStore.get(workspaceId, projectionAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics {
    return buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
