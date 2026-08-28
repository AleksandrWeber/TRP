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
 * W5-N02-b — durable Email notification anchor persistence on Notification Delivery owner.
 * Storage only — no SMTP I/O, outbound delivery, restart recovery, or operational continuity.
 */
@Injectable()
export class EmailNotificationPersistenceService {
  constructor(
    @Inject(EMAIL_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: EmailNotificationAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableEmailNotificationAnchor | null> {
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
    return outcome;
  }
}
