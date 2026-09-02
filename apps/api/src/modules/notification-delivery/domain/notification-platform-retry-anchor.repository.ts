import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetryAnchor } from './durable-notification-platform-retry-anchor';

/**
 * Persistence port for durable Notification Platform Retry anchors (W5-N13-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformRetryAnchorRepository {
  saveNotificationPlatformRetryAnchor(
    anchor: DurableNotificationPlatformRetryAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetryAnchor(
    workspaceId: string,
    retryAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryAnchor | null>;
}

export const NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY',
);
