import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetryExecutionAnchorState,
  type DurableNotificationPlatformRetryExecutionAnchor,
  type NotificationPlatformRetryExecutionAnchorPersistenceOutcome,
  type NotificationPlatformRetryExecutionAnchorState,
} from './domain/durable-notification-platform-retry-execution-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryExecutionAnchorRepository,
} from './domain/notification-platform-retry-execution-anchor.repository';
import { NotificationPlatformRetryExecutionRecoveryStore } from './domain/notification-platform-retry-execution-recovery-store';

export type PersistNotificationPlatformRetryExecutionAnchorCommand = Readonly<{
  workspaceId: string;
  retryExecutionAnchorId: string;
  platformRetryExecutionType: string;
  retryExecutionState?: NotificationPlatformRetryExecutionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N18-b — durable Notification Platform Retry Execution anchor persistence on Notification Delivery owner.
 * Storage only — no retry execution runtime, restart recovery, operational continuity, or transport I/O.
 * W5-N18-c — write-through to recovery store after hydrate.
 */
@Injectable()
export class NotificationPlatformRetryExecutionPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryExecutionAnchorRepository,
    @Inject(NotificationPlatformRetryExecutionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryExecutionRecoveryStore,
  ) {}

  async loadNotificationPlatformRetryExecutionAnchor(
    workspaceId: string,
    retryExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryExecutionAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, retryExecutionAnchorId);
    }
    return this.repository.loadNotificationPlatformRetryExecutionAnchor(
      workspaceId,
      retryExecutionAnchorId,
    );
  }

  async listAllNotificationPlatformRetryExecutionAnchors(): Promise<
    readonly DurableNotificationPlatformRetryExecutionAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetryExecutionAnchors();
  }

  async persistNotificationPlatformRetryExecutionAnchor(
    command: PersistNotificationPlatformRetryExecutionAnchorCommand,
  ): Promise<NotificationPlatformRetryExecutionAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetryExecutionAnchor(
      command.workspaceId,
      command.retryExecutionAnchorId,
    );
    const outcome = buildNotificationPlatformRetryExecutionAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetryExecutionAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
