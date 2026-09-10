import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetrySchedulingAnchorState,
  type DurableNotificationPlatformRetrySchedulingAnchor,
  type NotificationPlatformRetrySchedulingAnchorPersistenceOutcome,
  type NotificationPlatformRetrySchedulingAnchorState,
} from './domain/durable-notification-platform-retry-scheduling-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingAnchorRepository,
} from './domain/notification-platform-retry-scheduling-anchor.repository';
import { NotificationPlatformRetrySchedulingRecoveryStore } from './domain/notification-platform-retry-scheduling-recovery-store';

export type PersistNotificationPlatformRetrySchedulingAnchorCommand = Readonly<{
  workspaceId: string;
  retrySchedulingAnchorId: string;
  platformRetrySchedulingType: string;
  retrySchedulingState?: NotificationPlatformRetrySchedulingAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N19-b — durable Notification Platform Retry Scheduling anchor persistence on Notification Delivery owner.
 * Storage only — no retry scheduling runtime, restart recovery, operational continuity, timing calculation, or transport I/O.
 * W5-N19-c — write-through to recovery store after hydrate.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingRecoveryStore,
  ) {}

  async loadNotificationPlatformRetrySchedulingAnchor(
    workspaceId: string,
    retrySchedulingAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, retrySchedulingAnchorId);
    }
    return this.repository.loadNotificationPlatformRetrySchedulingAnchor(
      workspaceId,
      retrySchedulingAnchorId,
    );
  }

  async listAllNotificationPlatformRetrySchedulingAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetrySchedulingAnchors();
  }

  async persistNotificationPlatformRetrySchedulingAnchor(
    command: PersistNotificationPlatformRetrySchedulingAnchorCommand,
  ): Promise<NotificationPlatformRetrySchedulingAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetrySchedulingAnchor(
      command.workspaceId,
      command.retrySchedulingAnchorId,
    );
    const outcome = buildNotificationPlatformRetrySchedulingAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetrySchedulingAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
