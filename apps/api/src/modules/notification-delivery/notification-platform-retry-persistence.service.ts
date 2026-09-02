import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetryAnchorState,
  type DurableNotificationPlatformRetryAnchor,
  type NotificationPlatformRetryAnchorPersistenceOutcome,
  type NotificationPlatformRetryAnchorState,
} from './domain/durable-notification-platform-retry-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryAnchorRepository,
} from './domain/notification-platform-retry-anchor.repository';
import { NotificationPlatformRetryRecoveryStore } from './domain/notification-platform-retry-recovery-store';

export type PersistNotificationPlatformRetryAnchorCommand = Readonly<{
  workspaceId: string;
  retryAnchorId: string;
  platformRetryType: string;
  retryState?: NotificationPlatformRetryAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N13-b/c — durable Notification Platform Retry anchor persistence on Notification Delivery owner.
 * W5-N13-c — write-through to recovery store after hydrate.
 * Storage only — no retry runtime, retry execution, retry scheduling, retry queue processing,
 * dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformRetryPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryAnchorRepository,
    @Inject(NotificationPlatformRetryRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryRecoveryStore,
  ) {}

  async loadAnchor(
    workspaceId: string,
    retryAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, retryAnchorId);
    }
    return this.repository.loadNotificationPlatformRetryAnchor(workspaceId, retryAnchorId);
  }

  async persistRetryAnchor(
    command: PersistNotificationPlatformRetryAnchorCommand,
  ): Promise<NotificationPlatformRetryAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.retryAnchorId);
    const outcome = buildNotificationPlatformRetryAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetryAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
