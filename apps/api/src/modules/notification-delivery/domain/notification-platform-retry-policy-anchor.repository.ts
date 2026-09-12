import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetryPolicyAnchor } from './durable-notification-platform-retry-policy-anchor';

/**
 * Persistence port for durable Notification Platform Retry Policy anchors (W5-N20-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformRetryPolicyAnchorRepository {
  saveNotificationPlatformRetryPolicyAnchor(
    anchor: DurableNotificationPlatformRetryPolicyAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetryPolicyAnchor(
    workspaceId: string,
    retryPolicyAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryPolicyAnchor | null>;

  /** Deterministic load for restart recovery (W5-N20-c). */
  listAllNotificationPlatformRetryPolicyAnchors(): Promise<
    readonly DurableNotificationPlatformRetryPolicyAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_REPOSITORY',
);
