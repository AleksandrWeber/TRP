import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetryBackoffAnchorState,
  type DurableNotificationPlatformRetryBackoffAnchor,
  type NotificationPlatformRetryBackoffAnchorPersistenceOutcome,
  type NotificationPlatformRetryBackoffAnchorState,
} from './domain/durable-notification-platform-retry-backoff-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryBackoffAnchorRepository,
} from './domain/notification-platform-retry-backoff-anchor.repository';
import { NotificationPlatformRetryBackoffRecoveryStore } from './domain/notification-platform-retry-backoff-recovery-store';

export type PersistNotificationPlatformRetryBackoffAnchorCommand = Readonly<{
  workspaceId: string;
  retryBackoffAnchorId: string;
  platformRetryBackoffType: string;
  retryBackoffState?: NotificationPlatformRetryBackoffAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N21-b — durable Notification Platform Retry Backoff anchor persistence on Notification Delivery owner.
 * Storage only — no backoff calculation runtime, restart recovery, operational continuity, policy evaluation, or transport I/O.
 * W5-N21-c — write-through to recovery store after hydrate.
 */
@Injectable()
export class NotificationPlatformRetryBackoffPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryBackoffAnchorRepository,
    @Inject(NotificationPlatformRetryBackoffRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryBackoffRecoveryStore,
  ) {}

  async loadNotificationPlatformRetryBackoffAnchor(
    workspaceId: string,
    retryBackoffAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, retryBackoffAnchorId);
    }
    return this.repository.loadNotificationPlatformRetryBackoffAnchor(
      workspaceId,
      retryBackoffAnchorId,
    );
  }

  async listAllNotificationPlatformRetryBackoffAnchors(): Promise<
    readonly DurableNotificationPlatformRetryBackoffAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetryBackoffAnchors();
  }

  async persistNotificationPlatformRetryBackoffAnchor(
    command: PersistNotificationPlatformRetryBackoffAnchorCommand,
  ): Promise<NotificationPlatformRetryBackoffAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetryBackoffAnchor(
      command.workspaceId,
      command.retryBackoffAnchorId,
    );
    const outcome = buildNotificationPlatformRetryBackoffAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetryBackoffAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
