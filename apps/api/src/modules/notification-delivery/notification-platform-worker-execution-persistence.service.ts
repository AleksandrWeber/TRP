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
import { NotificationPlatformWorkerExecutionRecoveryStore } from './notification-platform-worker-execution-recovery-store';

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
 * W5-N10-b/c — durable Notification Platform Worker Execution anchor persistence on Notification Delivery owner.
 * W5-N10-c — write-through to recovery store after hydrate.
 * Storage only — no worker runtime, scheduler, retry, dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformWorkerExecutionPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkerExecutionAnchorRepository,
    @Inject(NotificationPlatformWorkerExecutionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformWorkerExecutionRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    workerExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerExecutionAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, workerExecutionAnchorId);
    }
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
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
