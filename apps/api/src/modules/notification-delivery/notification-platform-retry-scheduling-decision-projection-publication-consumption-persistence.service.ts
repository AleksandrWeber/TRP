import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorPersistenceOutcome,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState,
} from './domain/durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository,
} from './domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-recovery-store';

export type PersistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorCommand =
  Readonly<{
    workspaceId: string;
    consumptionAnchorId: string;
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType: string;
    consumptionAnchorState?: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState;
    channelScope?: string | null;
    correlationId?: string | null;
    actorId?: string | null;
    recordedAt: string;
  }>;

/**
 * W5-N29-b storage only — durable Notification Platform Retry Scheduling Decision Projection Publication
 * Consumption anchor persistence on Notification Delivery owner.
 * Write-through to recovery store; full restart hydrate is W5-N29-c.
 * Storage only — informational; not runtime consumption, not runtime publication, not runtime decision
 * projection, not scheduling, not eligibility, not backoff calculation, not execution, not operational
 * continuity. Persisted data is informational only.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService {
  constructor(
    @Inject(
      NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_REPOSITORY,
    )
    private readonly repository: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository,
    @Inject(
      NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore,
    )
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore,
  ) {}

  async loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
    workspaceId: string,
    consumptionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, consumptionAnchorId);
    }
    return this.repository.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
      workspaceId,
      consumptionAnchorId,
    );
  }

  async listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchors();
  }

  async persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
    command: PersistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorCommand,
  ): Promise<NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorPersistenceOutcome> {
    const prior =
      await this.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
        command.workspaceId,
        command.consumptionAnchorId,
      );
    const outcome =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState({
        ...command,
        prior,
      });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
      outcome.anchor,
    );
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
