import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformSchedulerAnchorState,
  type DurableNotificationPlatformSchedulerAnchor,
  type NotificationPlatformSchedulerAnchorPersistenceOutcome,
  type NotificationPlatformSchedulerAnchorState,
} from './domain/durable-notification-platform-scheduler-anchor';
import {
  NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY,
  type NotificationPlatformSchedulerAnchorRepository,
} from './domain/notification-platform-scheduler-anchor.repository';

export type PersistNotificationPlatformSchedulerAnchorCommand = Readonly<{
  workspaceId: string;
  schedulerAnchorId: string;
  platformSchedulerType: string;
  schedulerState?: NotificationPlatformSchedulerAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N12-b — durable Notification Platform Scheduler anchor persistence on Notification Delivery owner.
 * Storage only — no scheduler runtime, scheduling engine, execution loop, retry, dead-letter processing,
 * recovery store, restart recovery, or operational continuity.
 */
@Injectable()
export class NotificationPlatformSchedulerPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformSchedulerAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    schedulerAnchorId: string,
  ): Promise<DurableNotificationPlatformSchedulerAnchor | null> {
    return this.repository.loadNotificationPlatformSchedulerAnchor(workspaceId, schedulerAnchorId);
  }

  async persistSchedulerAnchor(
    command: PersistNotificationPlatformSchedulerAnchorCommand,
  ): Promise<NotificationPlatformSchedulerAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.schedulerAnchorId);
    const outcome = buildNotificationPlatformSchedulerAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformSchedulerAnchor(outcome.anchor);
    return outcome;
  }
}
