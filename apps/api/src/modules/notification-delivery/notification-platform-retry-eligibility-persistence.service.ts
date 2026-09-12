import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetryEligibilityAnchorState,
  type DurableNotificationPlatformRetryEligibilityAnchor,
  type NotificationPlatformRetryEligibilityAnchorPersistenceOutcome,
  type NotificationPlatformRetryEligibilityAnchorState,
} from './domain/durable-notification-platform-retry-eligibility-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryEligibilityAnchorRepository,
} from './domain/notification-platform-retry-eligibility-anchor.repository';
import { NotificationPlatformRetryEligibilityRecoveryStore } from './domain/notification-platform-retry-eligibility-recovery-store';

export type PersistNotificationPlatformRetryEligibilityAnchorCommand = Readonly<{
  workspaceId: string;
  eligibilityAnchorId: string;
  platformRetryEligibilityType: string;
  eligibilityAnchorState?: NotificationPlatformRetryEligibilityAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N23-b storage only — durable Notification Platform Retry Eligibility anchor
 * persistence on Notification Delivery owner.
 * W5-N23-c — write-through to recovery store after hydrate.
 * Storage only — informational; not eligibility evaluation, not calculation, not scheduling,
 * not execution, not operational continuity. Persisted data is informational only.
 */
@Injectable()
export class NotificationPlatformRetryEligibilityPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryEligibilityAnchorRepository,
    @Inject(NotificationPlatformRetryEligibilityRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryEligibilityRecoveryStore,
  ) {}

  async loadNotificationPlatformRetryEligibilityAnchor(
    workspaceId: string,
    eligibilityAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryEligibilityAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, eligibilityAnchorId);
    }
    return this.repository.loadNotificationPlatformRetryEligibilityAnchor(
      workspaceId,
      eligibilityAnchorId,
    );
  }

  async listAllNotificationPlatformRetryEligibilityAnchors(): Promise<
    readonly DurableNotificationPlatformRetryEligibilityAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetryEligibilityAnchors();
  }

  async persistNotificationPlatformRetryEligibilityAnchor(
    command: PersistNotificationPlatformRetryEligibilityAnchorCommand,
  ): Promise<NotificationPlatformRetryEligibilityAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetryEligibilityAnchor(
      command.workspaceId,
      command.eligibilityAnchorId,
    );
    const outcome = buildNotificationPlatformRetryEligibilityAnchorState({
      ...command,
      prior,
    });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetryEligibilityAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
