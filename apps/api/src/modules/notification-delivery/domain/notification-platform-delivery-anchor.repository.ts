import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformDeliveryAnchor } from './durable-notification-platform-delivery-anchor';

/**
 * Persistence port for durable Notification Platform Delivery anchors (W5-N06-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformDeliveryAnchorRepository {
  saveNotificationPlatformDeliveryAnchor(
    anchor: DurableNotificationPlatformDeliveryAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformDeliveryAnchor(
    workspaceId: string,
    deliveryAnchorId: string,
  ): Promise<DurableNotificationPlatformDeliveryAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N06-c). */
  listAllNotificationPlatformDeliveryAnchors(): Promise<
    readonly DurableNotificationPlatformDeliveryAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY',
);
