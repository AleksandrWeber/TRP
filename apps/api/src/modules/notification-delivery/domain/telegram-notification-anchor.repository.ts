import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableTelegramNotificationAnchor } from './durable-telegram-notification-anchor';

/**
 * Persistence port for durable Telegram notification anchors (W5-N01-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface TelegramNotificationAnchorRepository {
  saveTelegramNotificationAnchor(
    anchor: DurableTelegramNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadTelegramNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableTelegramNotificationAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N01-c). */
  listAllTelegramNotificationAnchors(): Promise<readonly DurableTelegramNotificationAnchor[]>;
}

export const TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY = Symbol(
  'TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY',
);
