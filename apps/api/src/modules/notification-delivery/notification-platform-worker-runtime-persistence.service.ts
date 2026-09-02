import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformWorkerRuntimeAnchorState,
  type DurableNotificationPlatformWorkerRuntimeAnchor,
  type NotificationPlatformWorkerRuntimeAnchorPersistenceOutcome,
  type NotificationPlatformWorkerRuntimeAnchorState,
} from './domain/durable-notification-platform-worker-runtime-anchor';
import {
  NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY,
  type NotificationPlatformWorkerRuntimeAnchorRepository,
} from './domain/notification-platform-worker-runtime-anchor.repository';
import { NotificationPlatformWorkerRuntimeRecoveryStore } from './notification-platform-worker-runtime-recovery-store';

export type PersistNotificationPlatformWorkerRuntimeAnchorCommand = Readonly<{
  workspaceId: string;
  workerRuntimeAnchorId: string;
  platformWorkerRuntimeType: string;
  workerRuntimeState?: NotificationPlatformWorkerRuntimeAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N11-b/c — durable Notification Platform Worker Runtime anchor persistence on Notification Delivery owner.
 * W5-N11-c — write-through to recovery store after hydrate.
 * Storage only — no worker runtime execution, scheduler, retry, dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformWorkerRuntimePersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkerRuntimeAnchorRepository,
    @Inject(NotificationPlatformWorkerRuntimeRecoveryStore)
    private readonly recoveryStore: NotificationPlatformWorkerRuntimeRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    workerRuntimeAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerRuntimeAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, workerRuntimeAnchorId);
    }
    return this.repository.loadNotificationPlatformWorkerRuntimeAnchor(
      workspaceId,
      workerRuntimeAnchorId,
    );
  }

  async persistWorkerRuntimeAnchor(
    command: PersistNotificationPlatformWorkerRuntimeAnchorCommand,
  ): Promise<NotificationPlatformWorkerRuntimeAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.workerRuntimeAnchorId);
    const outcome = buildNotificationPlatformWorkerRuntimeAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformWorkerRuntimeAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
