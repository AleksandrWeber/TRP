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
import { TelegramNotificationRecoveryStore } from './telegram-notification-recovery-store';

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
 * W5-N01-b/c — durable Telegram notification anchor persistence on Notification Delivery owner.
 * W5-N01-c — write-through to recovery store after hydrate.
 * Storage only — no Bot API I/O, outbound delivery, or operational continuity.
 */
@Injectable()
export class TelegramNotificationPersistenceService {
  constructor(
    @Inject(TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: TelegramNotificationAnchorRepository,
    @Inject(TelegramNotificationRecoveryStore)
    private readonly recoveryStore: TelegramNotificationRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableTelegramNotificationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, notificationId);
    }
    return this.repository.loadTelegramNotificationAnchor(workspaceId, notificationId);
  }

  async persistNotificationAnchor(
    command: PersistTelegramNotificationAnchorCommand,
  ): Promise<TelegramNotificationAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.notificationId);
    const outcome = buildTelegramNotificationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveTelegramNotificationAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
