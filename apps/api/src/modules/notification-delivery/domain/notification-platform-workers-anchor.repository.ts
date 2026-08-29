import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformWorkersAnchor } from './durable-notification-platform-workers-anchor';

/**
 * Persistence port for durable Notification Platform Workers anchors (W5-N09-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformWorkersAnchorRepository {
  saveNotificationPlatformWorkersAnchor(
    anchor: DurableNotificationPlatformWorkersAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformWorkersAnchor(
    workspaceId: string,
    workersAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkersAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N09-c). */
  listAllNotificationPlatformWorkersAnchors(): Promise<
    readonly DurableNotificationPlatformWorkersAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY',
);
