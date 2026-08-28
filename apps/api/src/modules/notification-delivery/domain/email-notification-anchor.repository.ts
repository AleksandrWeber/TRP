import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableEmailNotificationAnchor } from './durable-email-notification-anchor';

/**
 * Persistence port for durable Email notification anchors (W5-N02-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface EmailNotificationAnchorRepository {
  saveEmailNotificationAnchor(
    anchor: DurableEmailNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadEmailNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableEmailNotificationAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N02-c). */
  listAllEmailNotificationAnchors(): Promise<readonly DurableEmailNotificationAnchor[]>;
}

export const EMAIL_NOTIFICATION_ANCHOR_REPOSITORY = Symbol('EMAIL_NOTIFICATION_ANCHOR_REPOSITORY');
