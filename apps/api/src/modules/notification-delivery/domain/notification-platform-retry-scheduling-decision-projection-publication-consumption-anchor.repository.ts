import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';

/**
 * Persistence port for durable Notification Platform Retry Scheduling Decision Projection Publication
 * Consumption anchors (W5-N29-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — informational; not runtime consumption, not runtime publication, not runtime decision
 * projection, not scheduling, not eligibility, not backoff calculation, not execution, not restart recovery.
 * Persisted data is informational only.
 */
export interface NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository {
  saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
    workspaceId: string,
    consumptionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor | null>;

  /** Deterministic load for restart recovery (W5-N29-c). */
  listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_REPOSITORY =
  Symbol(
    'NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_REPOSITORY',
  );
