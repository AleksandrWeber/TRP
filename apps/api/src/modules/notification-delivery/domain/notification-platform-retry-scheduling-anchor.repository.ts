import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetrySchedulingAnchor } from './durable-notification-platform-retry-scheduling-anchor';

/**
 * Persistence port for durable Notification Platform Retry Scheduling anchors (W5-N19-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformRetrySchedulingAnchorRepository {
  saveNotificationPlatformRetrySchedulingAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetrySchedulingAnchor(
    workspaceId: string,
    retrySchedulingAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingAnchor | null>;

  /** Deterministic load for restart recovery (W5-N19-c). */
  listAllNotificationPlatformRetrySchedulingAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_REPOSITORY',
);
