import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformDeadLetterAnchorState,
  type DurableNotificationPlatformDeadLetterAnchor,
  type NotificationPlatformDeadLetterAnchorPersistenceOutcome,
  type NotificationPlatformDeadLetterAnchorState,
} from './domain/durable-notification-platform-dead-letter-anchor';
import {
  NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_REPOSITORY,
  type NotificationPlatformDeadLetterAnchorRepository,
} from './domain/notification-platform-dead-letter-anchor.repository';

export type PersistNotificationPlatformDeadLetterAnchorCommand = Readonly<{
  workspaceId: string;
  deadLetterAnchorId: string;
  platformDeadLetterType: string;
  deadLetterState?: NotificationPlatformDeadLetterAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N14-b — durable Notification Platform Dead Letter anchor persistence on Notification Delivery owner.
 * Storage only — no dead-letter runtime, dead-letter replay, dead-letter processing, retry integration,
 * scheduler integration, workers, recovery store, or operational continuity.
 */
@Injectable()
export class NotificationPlatformDeadLetterPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDeadLetterAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    deadLetterAnchorId: string,
  ): Promise<DurableNotificationPlatformDeadLetterAnchor | null> {
    return this.repository.loadNotificationPlatformDeadLetterAnchor(
      workspaceId,
      deadLetterAnchorId,
    );
  }

  async persistDeadLetterAnchor(
    command: PersistNotificationPlatformDeadLetterAnchorCommand,
  ): Promise<NotificationPlatformDeadLetterAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.deadLetterAnchorId);
    const outcome = buildNotificationPlatformDeadLetterAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformDeadLetterAnchor(outcome.anchor);
    return outcome;
  }
}
