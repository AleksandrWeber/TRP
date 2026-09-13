import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
  type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorPersistenceOutcome,
  type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState,
} from './domain/durable-notification-platform-retry-scheduling-decision-evaluation-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository,
} from './domain/notification-platform-retry-scheduling-decision-evaluation-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-evaluation-recovery-store';

export type PersistNotificationPlatformRetrySchedulingDecisionEvaluationAnchorCommand = Readonly<{
  workspaceId: string;
  evaluationAnchorId: string;
  platformRetrySchedulingDecisionEvaluationType: string;
  evaluationAnchorState?: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N26-b storage only — durable Notification Platform Retry Scheduling Decision Evaluation anchor
 * persistence on Notification Delivery owner.
 * Write-through to recovery store; full restart hydrate is W5-N26-c.
 * Storage only — informational; not runtime decision evaluation, not scheduling, not eligibility,
 * not backoff calculation, not execution, not operational continuity. Persisted data is
 * informational only.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionEvaluationPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStore,
  ) {}

  async loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
    workspaceId: string,
    evaluationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, evaluationAnchorId);
    }
    return this.repository.loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
      workspaceId,
      evaluationAnchorId,
    );
  }

  async listAllNotificationPlatformRetrySchedulingDecisionEvaluationAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetrySchedulingDecisionEvaluationAnchors();
  }

  async persistNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
    command: PersistNotificationPlatformRetrySchedulingDecisionEvaluationAnchorCommand,
  ): Promise<NotificationPlatformRetrySchedulingDecisionEvaluationAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
      command.workspaceId,
      command.evaluationAnchorId,
    );
    const outcome = buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState({
      ...command,
      prior,
    });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
      outcome.anchor,
    );
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
