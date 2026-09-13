import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-anchor';

/**
 * Persistence port for durable Notification Platform Retry Scheduling Decision Projection anchors (W5-N27-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — informational; not runtime decision projection, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export interface NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository {
  saveNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
    workspaceId: string,
    projectionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null>;

  /** Deterministic load for restart recovery (W5-N27-c). */
  listAllNotificationPlatformRetrySchedulingDecisionProjectionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_REPOSITORY',
);
