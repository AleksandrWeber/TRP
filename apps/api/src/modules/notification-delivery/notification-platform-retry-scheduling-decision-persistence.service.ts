import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetrySchedulingDecisionAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionAnchor,
  type NotificationPlatformRetrySchedulingDecisionAnchorPersistenceOutcome,
  type NotificationPlatformRetrySchedulingDecisionAnchorState,
} from './domain/durable-notification-platform-retry-scheduling-decision-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionAnchorRepository,
} from './domain/notification-platform-retry-scheduling-decision-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-recovery-store';

export type PersistNotificationPlatformRetrySchedulingDecisionAnchorCommand = Readonly<{
  workspaceId: string;
  decisionAnchorId: string;
  platformRetrySchedulingDecisionType: string;
  decisionAnchorState?: NotificationPlatformRetrySchedulingDecisionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N25-b storage only — durable Notification Platform Retry Scheduling Decision anchor
 * persistence on Notification Delivery owner.
 * Write-through to recovery store; full restart hydrate is W5-N25-c.
 * Storage only — informational; not runtime decision logic, not scheduling, not eligibility,
 * not backoff calculation, not execution, not operational continuity. Persisted data is
 * informational only.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingDecisionAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionRecoveryStore,
  ) {}

  async loadNotificationPlatformRetrySchedulingDecisionAnchor(
    workspaceId: string,
    decisionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, decisionAnchorId);
    }
    return this.repository.loadNotificationPlatformRetrySchedulingDecisionAnchor(
      workspaceId,
      decisionAnchorId,
    );
  }

  async listAllNotificationPlatformRetrySchedulingDecisionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetrySchedulingDecisionAnchors();
  }

  async persistNotificationPlatformRetrySchedulingDecisionAnchor(
    command: PersistNotificationPlatformRetrySchedulingDecisionAnchorCommand,
  ): Promise<NotificationPlatformRetrySchedulingDecisionAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetrySchedulingDecisionAnchor(
      command.workspaceId,
      command.decisionAnchorId,
    );
    const outcome = buildNotificationPlatformRetrySchedulingDecisionAnchorState({
      ...command,
      prior,
    });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetrySchedulingDecisionAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
