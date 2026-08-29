import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurablePushNotificationAnchor } from './durable-push-notification-anchor';

/**
 * Persistence port for durable Push notification anchors (W5-N04-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface PushNotificationAnchorRepository {
  savePushNotificationAnchor(
    anchor: DurablePushNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadPushNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurablePushNotificationAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N04-c). */
  listAllPushNotificationAnchors(): Promise<readonly DurablePushNotificationAnchor[]>;
}

export const PUSH_NOTIFICATION_ANCHOR_REPOSITORY = Symbol('PUSH_NOTIFICATION_ANCHOR_REPOSITORY');
