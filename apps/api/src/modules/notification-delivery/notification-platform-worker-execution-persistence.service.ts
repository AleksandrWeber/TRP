import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformWorkerExecutionAnchorState,
  type DurableNotificationPlatformWorkerExecutionAnchor,
  type NotificationPlatformWorkerExecutionAnchorPersistenceOutcome,
  type NotificationPlatformWorkerExecutionAnchorState,
} from './domain/durable-notification-platform-worker-execution-anchor';
import {
  NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY,
  type NotificationPlatformWorkerExecutionAnchorRepository,
} from './domain/notification-platform-worker-execution-anchor.repository';

export type PersistNotificationPlatformWorkerExecutionAnchorCommand = Readonly<{
  workspaceId: string;
  workerExecutionAnchorId: string;
  platformWorkerExecutionType: string;
  workerExecutionState?: NotificationPlatformWorkerExecutionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N10-b — durable Notification Platform Worker Execution anchor persistence on Notification Delivery owner.
 * Storage only — no worker runtime, scheduler, retry, dead-letter processing, orchestration, or restart recovery.
 */
@Injectable()
export class NotificationPlatformWorkerExecutionPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkerExecutionAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    workerExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerExecutionAnchor | null> {
    return this.repository.loadNotificationPlatformWorkerExecutionAnchor(
      workspaceId,
      workerExecutionAnchorId,
    );
  }

  async persistWorkerExecutionAnchor(
    command: PersistNotificationPlatformWorkerExecutionAnchorCommand,
  ): Promise<NotificationPlatformWorkerExecutionAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.workerExecutionAnchorId);
    const outcome = buildNotificationPlatformWorkerExecutionAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformWorkerExecutionAnchor(outcome.anchor);
    return outcome;
  }
}
