import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetryBackoffAnchor } from './durable-notification-platform-retry-backoff-anchor';

/**
 * Persistence port for durable Notification Platform Retry Backoff anchors (W5-N21-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformRetryBackoffAnchorRepository {
  saveNotificationPlatformRetryBackoffAnchor(
    anchor: DurableNotificationPlatformRetryBackoffAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetryBackoffAnchor(
    workspaceId: string,
    retryBackoffAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffAnchor | null>;

  /** Deterministic load for restart recovery (W5-N21-c). */
  listAllNotificationPlatformRetryBackoffAnchors(): Promise<
    readonly DurableNotificationPlatformRetryBackoffAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_REPOSITORY',
);
