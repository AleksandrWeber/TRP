import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor } from './durable-notification-platform-retry-scheduling-decision-evaluation-anchor';
import {
  recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess,
} from './notification-platform-retry-scheduling-decision-evaluation-continuity-status';
import { NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore } from './notification-platform-retry-scheduling-decision-evaluation-recovery-store';
import {
  buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics,
  prepareNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsForRecovery,
  type NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics,
} from './notification-platform-retry-scheduling-decision-evaluation-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository,
} from './notification-platform-retry-scheduling-decision-evaluation-anchor.repository';

/**
 * W5-N26-c — deterministic restart recovery for durable Notification Platform Retry
 * Scheduling Decision anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish runtime decision evaluation, operational continuity, scheduling, eligibility,
 * backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionEvaluationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics> {
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart();
    try {
      const persisted =
        await this.repository.listAllNotificationPlatformRetrySchedulingDecisionEvaluationAnchors();
      const recovered =
        prepareNotificationPlatformRetrySchedulingDecisionEvaluationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics =
        buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    evaluationAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor | null {
    return this.recoveryStore.get(workspaceId, evaluationAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics {
    return buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
