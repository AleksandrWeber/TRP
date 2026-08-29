import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformWorkersAnchorState,
  type DurableNotificationPlatformWorkersAnchor,
  type NotificationPlatformWorkersAnchorPersistenceOutcome,
  type NotificationPlatformWorkersAnchorState,
} from './domain/durable-notification-platform-workers-anchor';
import {
  NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY,
  type NotificationPlatformWorkersAnchorRepository,
} from './domain/notification-platform-workers-anchor.repository';
import { NotificationPlatformWorkersRecoveryStore } from './notification-platform-workers-recovery-store';

export type PersistNotificationPlatformWorkersAnchorCommand = Readonly<{
  workspaceId: string;
  workersAnchorId: string;
  platformWorkerType: string;
  workersState?: NotificationPlatformWorkersAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N09-b/c — durable Notification Platform Workers anchor persistence on Notification Delivery owner.
 * W5-N09-c — write-through to recovery store after hydrate.
 * Storage only — no worker execution, scheduler, retry, dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformWorkersPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkersAnchorRepository,
    @Inject(NotificationPlatformWorkersRecoveryStore)
    private readonly recoveryStore: NotificationPlatformWorkersRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    workersAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkersAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, workersAnchorId);
    }
    return this.repository.loadNotificationPlatformWorkersAnchor(workspaceId, workersAnchorId);
  }

  async persistWorkersAnchor(
    command: PersistNotificationPlatformWorkersAnchorCommand,
  ): Promise<NotificationPlatformWorkersAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.workersAnchorId);
    const outcome = buildNotificationPlatformWorkersAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformWorkersAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
