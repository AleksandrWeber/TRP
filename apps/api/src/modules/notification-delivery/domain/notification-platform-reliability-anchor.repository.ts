import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformReliabilityAnchor } from './durable-notification-platform-reliability-anchor';

/**
 * Persistence port for durable Notification Platform Delivery Reliability anchors (W5-N17-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformReliabilityAnchorRepository {
  saveNotificationPlatformReliabilityAnchor(
    anchor: DurableNotificationPlatformReliabilityAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformReliabilityAnchor(
    workspaceId: string,
    reliabilityAnchorId: string,
  ): Promise<DurableNotificationPlatformReliabilityAnchor | null>;

  /** Deterministic load for restart recovery (W5-N17-c). */
  listAllNotificationPlatformReliabilityAnchors(): Promise<
    readonly DurableNotificationPlatformReliabilityAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_REPOSITORY',
);
