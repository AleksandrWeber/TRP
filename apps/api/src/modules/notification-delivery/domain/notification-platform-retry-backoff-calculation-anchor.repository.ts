import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformRetryBackoffCalculationAnchor } from './durable-notification-platform-retry-backoff-calculation-anchor';

/**
 * Persistence port for durable Notification Platform Retry Backoff Calculation anchors (W5-N22-b).
 * Implementations belong to notification-delivery infrastructure.
 * Storage only — not calculation runtime, not scheduling, not execution, not restart recovery,
 * not operational continuity. Persisted data is informational only.
 */
export interface NotificationPlatformRetryBackoffCalculationAnchorRepository {
  saveNotificationPlatformRetryBackoffCalculationAnchor(
    anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformRetryBackoffCalculationAnchor(
    workspaceId: string,
    calculationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffCalculationAnchor | null>;

  /** Deterministic load for restart recovery (W5-N22-c). */
  listAllNotificationPlatformRetryBackoffCalculationAnchors(): Promise<
    readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY',
);
