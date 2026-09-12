import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetrySchedulingDecisionAnchor } from './durable-notification-platform-retry-scheduling-decision-anchor';

/**
 * Persistence port for durable Notification Platform Retry Scheduling Decision anchors (W5-N25-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — informational; not runtime decision logic, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export interface NotificationPlatformRetrySchedulingDecisionAnchorRepository {
  saveNotificationPlatformRetrySchedulingDecisionAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetrySchedulingDecisionAnchor(
    workspaceId: string,
    decisionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionAnchor | null>;

  /** Deterministic load for restart recovery (W5-N25-c). */
  listAllNotificationPlatformRetrySchedulingDecisionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_REPOSITORY',
);
