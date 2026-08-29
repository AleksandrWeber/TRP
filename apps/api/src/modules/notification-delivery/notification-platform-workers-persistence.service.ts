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
 * W5-N09-b — durable Notification Platform Workers anchor persistence on Notification Delivery owner.
 * Storage only — no worker execution, scheduler, retry, dead-letter processing, orchestration,
 * restart recovery, or operational continuity.
 */
@Injectable()
export class NotificationPlatformWorkersPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkersAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    workersAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkersAnchor | null> {
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
    return outcome;
  }
}
