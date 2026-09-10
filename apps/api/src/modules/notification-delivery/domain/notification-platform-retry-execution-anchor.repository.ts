import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetryExecutionAnchor } from './durable-notification-platform-retry-execution-anchor';

/**
 * Persistence port for durable Notification Platform Retry Execution anchors (W5-N18-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformRetryExecutionAnchorRepository {
  saveNotificationPlatformRetryExecutionAnchor(
    anchor: DurableNotificationPlatformRetryExecutionAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetryExecutionAnchor(
    workspaceId: string,
    retryExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryExecutionAnchor | null>;

  /** Deterministic load for restart recovery (W5-N18-c). */
  listAllNotificationPlatformRetryExecutionAnchors(): Promise<
    readonly DurableNotificationPlatformRetryExecutionAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_REPOSITORY',
);
