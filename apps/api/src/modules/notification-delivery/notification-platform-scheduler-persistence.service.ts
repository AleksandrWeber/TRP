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
import { NotificationPlatformSchedulerRecoveryStore } from './domain/notification-platform-scheduler-recovery-store';

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
 * W5-N12-b/c — durable Notification Platform Scheduler anchor persistence on Notification Delivery owner.
 * W5-N12-c — write-through to recovery store after hydrate.
 * Storage only — no scheduler runtime, scheduling engine, execution loop, retry, dead-letter processing,
 * orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformSchedulerPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformSchedulerAnchorRepository,
    @Inject(NotificationPlatformSchedulerRecoveryStore)
    private readonly recoveryStore: NotificationPlatformSchedulerRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    schedulerAnchorId: string,
  ): Promise<DurableNotificationPlatformSchedulerAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, schedulerAnchorId);
    }
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
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
