import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformQueueAnchorState,
  type DurableNotificationPlatformQueueAnchor,
  type NotificationPlatformQueueAnchorPersistenceOutcome,
  type NotificationPlatformQueueAnchorState,
} from './domain/durable-notification-platform-queue-anchor';
import {
  NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY,
  type NotificationPlatformQueueAnchorRepository,
} from './domain/notification-platform-queue-anchor.repository';

export type PersistNotificationPlatformQueueAnchorCommand = Readonly<{
  workspaceId: string;
  queueAnchorId: string;
  platformQueueType: string;
  queueState?: NotificationPlatformQueueAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N08-b — durable Notification Platform Queue anchor persistence on Notification Delivery owner.
 * Storage only — no queue execution, queue workers, retry, scheduler, dispatcher, restart recovery,
 * or operational continuity.
 */
@Injectable()
export class NotificationPlatformQueuePersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformQueueAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    queueAnchorId: string,
  ): Promise<DurableNotificationPlatformQueueAnchor | null> {
    return this.repository.loadNotificationPlatformQueueAnchor(workspaceId, queueAnchorId);
  }

  async persistQueueAnchor(
    command: PersistNotificationPlatformQueueAnchorCommand,
  ): Promise<NotificationPlatformQueueAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.queueAnchorId);
    const outcome = buildNotificationPlatformQueueAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformQueueAnchor(outcome.anchor);
    return outcome;
  }
}
