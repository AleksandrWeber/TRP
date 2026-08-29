import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformDispatchAnchor } from './durable-notification-platform-dispatch-anchor';

/**
 * Persistence port for durable Notification Platform Dispatch anchors (W5-N07-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformDispatchAnchorRepository {
  saveNotificationPlatformDispatchAnchor(
    anchor: DurableNotificationPlatformDispatchAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformDispatchAnchor(
    workspaceId: string,
    dispatchAnchorId: string,
  ): Promise<DurableNotificationPlatformDispatchAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N07-c). */
  listAllNotificationPlatformDispatchAnchors(): Promise<
    readonly DurableNotificationPlatformDispatchAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY',
);
