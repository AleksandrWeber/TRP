import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformSchedulerAnchor } from './durable-notification-platform-scheduler-anchor';

/**
 * Persistence port for durable Notification Platform Scheduler anchors (W5-N12-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformSchedulerAnchorRepository {
  saveNotificationPlatformSchedulerAnchor(
    anchor: DurableNotificationPlatformSchedulerAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformSchedulerAnchor(
    workspaceId: string,
    schedulerAnchorId: string,
  ): Promise<DurableNotificationPlatformSchedulerAnchor | null>;

  /** Deterministic load for restart recovery (W5-N12-c). */
  listAllNotificationPlatformSchedulerAnchors(): Promise<
    readonly DurableNotificationPlatformSchedulerAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY',
);
