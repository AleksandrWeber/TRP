import { Inject, Injectable } from '@nestjs/common';
import {
  buildEmailNotificationAnchorState,
  type DurableEmailNotificationAnchor,
  type EmailNotificationAnchorDeliveryState,
  type EmailNotificationAnchorPersistenceOutcome,
} from './domain/durable-email-notification-anchor';
import {
  EMAIL_NOTIFICATION_ANCHOR_REPOSITORY,
  type EmailNotificationAnchorRepository,
} from './domain/email-notification-anchor.repository';
import { EmailNotificationRecoveryStore } from './email-notification-recovery-store';

export type PersistEmailNotificationAnchorCommand = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: EmailNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N02-b/c — durable Email notification anchor persistence on Notification Delivery owner.
 * W5-N02-c — write-through to recovery store after hydrate.
 * Storage only — no SMTP I/O, outbound delivery, or operational continuity.
 */
@Injectable()
export class EmailNotificationPersistenceService {
  constructor(
    @Inject(EMAIL_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: EmailNotificationAnchorRepository,
    @Inject(EmailNotificationRecoveryStore)
    private readonly recoveryStore: EmailNotificationRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableEmailNotificationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, notificationId);
    }
    return this.repository.loadEmailNotificationAnchor(workspaceId, notificationId);
  }

  async persistNotificationAnchor(
    command: PersistEmailNotificationAnchorCommand,
  ): Promise<EmailNotificationAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.notificationId);
    const outcome = buildEmailNotificationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveEmailNotificationAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
