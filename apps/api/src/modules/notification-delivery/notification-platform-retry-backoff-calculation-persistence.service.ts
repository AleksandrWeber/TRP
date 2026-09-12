import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformRetryBackoffCalculationAnchorState,
  type DurableNotificationPlatformRetryBackoffCalculationAnchor,
  type NotificationPlatformRetryBackoffCalculationAnchorPersistenceOutcome,
  type NotificationPlatformRetryBackoffCalculationAnchorState,
} from './domain/durable-notification-platform-retry-backoff-calculation-anchor';
import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryBackoffCalculationAnchorRepository,
} from './domain/notification-platform-retry-backoff-calculation-anchor.repository';

export type PersistNotificationPlatformRetryBackoffCalculationAnchorCommand = Readonly<{
  workspaceId: string;
  calculationAnchorId: string;
  platformBackoffCalculationType: string;
  calculationAnchorState?: NotificationPlatformRetryBackoffCalculationAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N22-b storage only — durable Notification Platform Retry Backoff Calculation anchor
 * persistence on Notification Delivery owner.
 * Storage only — not calculation runtime, not scheduling, not execution, not restart recovery,
 * not operational continuity. Persisted data is informational only.
 * No recovery store (that is W5-N22-c).
 */
@Injectable()
export class NotificationPlatformRetryBackoffCalculationPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryBackoffCalculationAnchorRepository,
  ) {}

  async loadNotificationPlatformRetryBackoffCalculationAnchor(
    workspaceId: string,
    calculationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffCalculationAnchor | null> {
    return this.repository.loadNotificationPlatformRetryBackoffCalculationAnchor(
      workspaceId,
      calculationAnchorId,
    );
  }

  async listAllNotificationPlatformRetryBackoffCalculationAnchors(): Promise<
    readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[]
  > {
    return this.repository.listAllNotificationPlatformRetryBackoffCalculationAnchors();
  }

  async persistNotificationPlatformRetryBackoffCalculationAnchor(
    command: PersistNotificationPlatformRetryBackoffCalculationAnchorCommand,
  ): Promise<NotificationPlatformRetryBackoffCalculationAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformRetryBackoffCalculationAnchor(
      command.workspaceId,
      command.calculationAnchorId,
    );
    const outcome = buildNotificationPlatformRetryBackoffCalculationAnchorState({
      ...command,
      prior,
    });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformRetryBackoffCalculationAnchor(outcome.anchor);
    return outcome;
  }
}
