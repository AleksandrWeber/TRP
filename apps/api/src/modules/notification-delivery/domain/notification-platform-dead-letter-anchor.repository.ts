import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformDeadLetterAnchor } from './durable-notification-platform-dead-letter-anchor';

/**
 * Persistence port for durable Notification Platform Dead Letter anchors (W5-N14-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformDeadLetterAnchorRepository {
  saveNotificationPlatformDeadLetterAnchor(
    anchor: DurableNotificationPlatformDeadLetterAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformDeadLetterAnchor(
    workspaceId: string,
    deadLetterAnchorId: string,
  ): Promise<DurableNotificationPlatformDeadLetterAnchor | null>;

  /** Deterministic load for restart recovery (W5-N14-c). */
  listAllNotificationPlatformDeadLetterAnchors(): Promise<
    readonly DurableNotificationPlatformDeadLetterAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_REPOSITORY',
);
