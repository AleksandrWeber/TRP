import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionAnchor } from './durable-notification-platform-retry-scheduling-decision-anchor';
import {
  recordNotificationPlatformRetrySchedulingDecisionRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionRecoverySuccess,
} from './notification-platform-retry-scheduling-decision-continuity-status';
import { NotificationPlatformRetrySchedulingDecisionRecoveryStore } from './notification-platform-retry-scheduling-decision-recovery-store';
import {
  buildNotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics,
  prepareNotificationPlatformRetrySchedulingDecisionAnchorsForRecovery,
  type NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics,
} from './notification-platform-retry-scheduling-decision-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionAnchorRepository,
} from './notification-platform-retry-scheduling-decision-anchor.repository';

/**
 * W5-N25-c — deterministic restart recovery for durable Notification Platform Retry
 * Scheduling Decision anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish runtime decision logic, operational continuity, scheduling, eligibility,
 * backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingDecisionAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics> {
    recordNotificationPlatformRetrySchedulingDecisionRecoveryStart();
    try {
      const persisted =
        await this.repository.listAllNotificationPlatformRetrySchedulingDecisionAnchors();
      const recovered =
        prepareNotificationPlatformRetrySchedulingDecisionAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics =
        buildNotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetrySchedulingDecisionRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetrySchedulingDecisionRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    decisionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionAnchor | null {
    return this.recoveryStore.get(workspaceId, decisionAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics {
    return buildNotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
