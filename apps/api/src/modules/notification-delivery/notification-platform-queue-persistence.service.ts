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
import { NotificationPlatformQueueRecoveryStore } from './notification-platform-queue-recovery-store';

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
 * W5-N08-b/c — durable Notification Platform Queue anchor persistence on Notification Delivery owner.
 * W5-N08-c — write-through to recovery store after hydrate.
 * Storage only — no queue execution, queue workers, retry, scheduler, dispatcher, or operational continuity.
 */
@Injectable()
export class NotificationPlatformQueuePersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformQueueAnchorRepository,
    @Inject(NotificationPlatformQueueRecoveryStore)
    private readonly recoveryStore: NotificationPlatformQueueRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    queueAnchorId: string,
  ): Promise<DurableNotificationPlatformQueueAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, queueAnchorId);
    }
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
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
