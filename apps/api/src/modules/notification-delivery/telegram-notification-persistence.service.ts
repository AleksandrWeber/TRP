import { Inject, Injectable } from '@nestjs/common';
import {
  buildTelegramNotificationAnchorState,
  type DurableTelegramNotificationAnchor,
  type TelegramNotificationAnchorDeliveryState,
  type TelegramNotificationAnchorPersistenceOutcome,
} from './domain/durable-telegram-notification-anchor';
import {
  TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY,
  type TelegramNotificationAnchorRepository,
} from './domain/telegram-notification-anchor.repository';

export type PersistTelegramNotificationAnchorCommand = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: TelegramNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N01-b — durable Telegram notification anchor persistence on Notification Delivery owner.
 * Storage only — no Bot API I/O, outbound delivery, restart recovery, or operational continuity.
 */
@Injectable()
export class TelegramNotificationPersistenceService {
  constructor(
    @Inject(TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: TelegramNotificationAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableTelegramNotificationAnchor | null> {
    return this.repository.loadTelegramNotificationAnchor(workspaceId, notificationId);
  }

  async persistNotificationAnchor(
    command: PersistTelegramNotificationAnchorCommand,
  ): Promise<TelegramNotificationAnchorPersistenceOutcome> {
    const prior = await this.repository.loadTelegramNotificationAnchor(
      command.workspaceId,
      command.notificationId,
    );
    const outcome = buildTelegramNotificationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveTelegramNotificationAnchor(outcome.anchor);
    return outcome;
  }
}
