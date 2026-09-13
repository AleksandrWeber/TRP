import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionAnchorPersistenceOutcome,
  type NotificationPlatformRetrySchedulingDecisionProjectionAnchorState,
} from './domain/durable-notification-platform-retry-scheduling-decision-projection-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository,
} from './domain/notification-platform-retry-scheduling-decision-projection-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-projection-recovery-store';

export type PersistNotificationPlatformRetrySchedulingDecisionProjectionAnchorCommand = Readonly<{
  workspaceId: string;
  projectionAnchorId: string;
  platformRetrySchedulingDecisionProjectionType: string;
  projectionAnchorState?: NotificationPlatformRetrySchedulingDecisionProjectionAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N27-b storage only — durable Notification Platform Retry Scheduling Decision Projection anchor
 * persistence on Notification Delivery owner.
 * Write-through to recovery store; full restart hydrate is W5-N27-c.
 * Storage only — informational; not runtime decision projection, not scheduling, not eligibility,
 * not backoff calculation, not execution, not operational continuity. Persisted data is
 * informational only.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionProjectionRecoveryStore,
  ) {}

  async loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
    workspaceId: string,
    projectionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, projectionAnchorId);
    }
    return this.repository.loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
      workspaceId,
      projectionAnchorId,
    );
  }

  async listAllNotificationPlatformRetrySchedulingDecisionProjectionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetrySchedulingDecisionProjectionAnchors();
  }

  async persistNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
    command: PersistNotificationPlatformRetrySchedulingDecisionProjectionAnchorCommand,
  ): Promise<NotificationPlatformRetrySchedulingDecisionProjectionAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
      command.workspaceId,
      command.projectionAnchorId,
    );
    const outcome = buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState({
      ...command,
      prior,
    });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
      outcome.anchor,
    );
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
