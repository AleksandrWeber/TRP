import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetryPolicyAnchorState,
  type DurableNotificationPlatformRetryPolicyAnchor,
  type NotificationPlatformRetryPolicyAnchorPersistenceOutcome,
  type NotificationPlatformRetryPolicyAnchorState,
} from './domain/durable-notification-platform-retry-policy-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryPolicyAnchorRepository,
} from './domain/notification-platform-retry-policy-anchor.repository';
import { NotificationPlatformRetryPolicyRecoveryStore } from './domain/notification-platform-retry-policy-recovery-store';

export type PersistNotificationPlatformRetryPolicyAnchorCommand = Readonly<{
  workspaceId: string;
  retryPolicyAnchorId: string;
  platformRetryPolicyType: string;
  retryPolicyState?: NotificationPlatformRetryPolicyAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N20-b — durable Notification Platform Retry Policy anchor persistence on Notification Delivery owner.
 * Storage only — no retry policy evaluation runtime, restart recovery, operational continuity, backoff calculation, or transport I/O.
 * W5-N20-c — write-through to recovery store after hydrate.
 */
@Injectable()
export class NotificationPlatformRetryPolicyPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryPolicyAnchorRepository,
    @Inject(NotificationPlatformRetryPolicyRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryPolicyRecoveryStore,
  ) {}

  async loadNotificationPlatformRetryPolicyAnchor(
    workspaceId: string,
    retryPolicyAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryPolicyAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, retryPolicyAnchorId);
    }
    return this.repository.loadNotificationPlatformRetryPolicyAnchor(
      workspaceId,
      retryPolicyAnchorId,
    );
  }

  async listAllNotificationPlatformRetryPolicyAnchors(): Promise<
    readonly DurableNotificationPlatformRetryPolicyAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetryPolicyAnchors();
  }

  async persistNotificationPlatformRetryPolicyAnchor(
    command: PersistNotificationPlatformRetryPolicyAnchorCommand,
  ): Promise<NotificationPlatformRetryPolicyAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetryPolicyAnchor(
      command.workspaceId,
      command.retryPolicyAnchorId,
    );
    const outcome = buildNotificationPlatformRetryPolicyAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetryPolicyAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
