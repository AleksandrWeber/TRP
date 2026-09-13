import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';

/**
 * Persistence port for durable Notification Platform Retry Scheduling Decision Projection Publication anchors (W5-N28-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — informational; not runtime publication, not runtime decision projection, not scheduling, not eligibility,
 * not backoff calculation, not execution, not restart recovery. Persisted data is informational only.
 */
export interface NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository {
  saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
    workspaceId: string,
    publicationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor | null>;

  /** Deterministic load for restart recovery (W5-N28-c). */
  listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_REPOSITORY =
  Symbol(
    'NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_REPOSITORY',
  );
