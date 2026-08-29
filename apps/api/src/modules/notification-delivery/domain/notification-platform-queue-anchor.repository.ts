import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformQueueAnchor } from './durable-notification-platform-queue-anchor';

/**
 * Persistence port for durable Notification Platform Queue anchors (W5-N08-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformQueueAnchorRepository {
  saveNotificationPlatformQueueAnchor(
    anchor: DurableNotificationPlatformQueueAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformQueueAnchor(
    workspaceId: string,
    queueAnchorId: string,
  ): Promise<DurableNotificationPlatformQueueAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N08-c). */
  listAllNotificationPlatformQueueAnchors(): Promise<
    readonly DurableNotificationPlatformQueueAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY',
);
