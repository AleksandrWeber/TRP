import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetryEligibilityAnchor } from './durable-notification-platform-retry-eligibility-anchor';

/**
 * Persistence port for durable Notification Platform Retry Eligibility anchors (W5-N23-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — informational; not eligibility evaluation, not calculation, not scheduling,
 * not execution, not restart recovery. Persisted data is informational only.
 */
export interface NotificationPlatformRetryEligibilityAnchorRepository {
  saveNotificationPlatformRetryEligibilityAnchor(
    anchor: DurableNotificationPlatformRetryEligibilityAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetryEligibilityAnchor(
    workspaceId: string,
    eligibilityAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryEligibilityAnchor | null>;

  /** Deterministic load for restart recovery (W5-N23-c). */
  listAllNotificationPlatformRetryEligibilityAnchors(): Promise<
    readonly DurableNotificationPlatformRetryEligibilityAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_REPOSITORY',
);
