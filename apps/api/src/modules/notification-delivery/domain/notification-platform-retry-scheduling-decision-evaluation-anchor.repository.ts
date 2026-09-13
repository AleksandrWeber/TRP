import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor } from './durable-notification-platform-retry-scheduling-decision-evaluation-anchor';

/**
 * Persistence port for durable Notification Platform Retry Scheduling Decision Evaluation anchors (W5-N26-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — informational; not runtime decision evaluation, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export interface NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository {
  saveNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
    workspaceId: string,
    evaluationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor | null>;

  /** Deterministic load for restart recovery (W5-N26-c). */
  listAllNotificationPlatformRetrySchedulingDecisionEvaluationAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_REPOSITORY',
);
