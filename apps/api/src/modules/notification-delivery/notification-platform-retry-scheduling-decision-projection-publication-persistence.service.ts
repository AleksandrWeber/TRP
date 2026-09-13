import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorPersistenceOutcome,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState,
} from './domain/durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository,
} from './domain/notification-platform-retry-scheduling-decision-projection-publication-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore } from './domain/notification-platform-retry-scheduling-decision-projection-publication-recovery-store';

export type PersistNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorCommand =
  Readonly<{
    workspaceId: string;
    publicationAnchorId: string;
    platformRetrySchedulingDecisionProjectionPublicationType: string;
    publicationAnchorState?: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState;
    channelScope?: string | null;
    correlationId?: string | null;
    actorId?: string | null;
    recordedAt: string;
  }>;

/**
 * W5-N28-b storage only — durable Notification Platform Retry Scheduling Decision Projection Publication
 * anchor persistence on Notification Delivery owner.
 * Write-through to recovery store; full restart hydrate is W5-N28-c.
 * Storage only — informational; not runtime publication, not runtime decision projection, not scheduling,
 * not eligibility, not backoff calculation, not execution, not operational continuity. Persisted data is
 * informational only.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationPersistenceService {
  constructor(
    @Inject(
      NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_REPOSITORY,
    )
    private readonly repository: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore,
  ) {}

  async loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
    workspaceId: string,
    publicationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, publicationAnchorId);
    }
    return this.repository.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
      workspaceId,
      publicationAnchorId,
    );
  }

  async listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchors();
  }

  async persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
    command: PersistNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorCommand,
  ): Promise<NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorPersistenceOutcome> {
    const prior =
      await this.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
        command.workspaceId,
        command.publicationAnchorId,
      );
    const outcome =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState({
        ...command,
        prior,
      });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
      outcome.anchor,
    );
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
