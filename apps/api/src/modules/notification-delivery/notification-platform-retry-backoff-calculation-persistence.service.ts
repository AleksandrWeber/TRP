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
import { NotificationPlatformRetryBackoffCalculationRecoveryStore } from './domain/notification-platform-retry-backoff-calculation-recovery-store';

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
 * W5-N22-c — write-through to recovery store after hydrate.
 * Storage only — not calculation runtime, not scheduling, not execution,
 * not operational continuity. Persisted data is informational only.
 */
@Injectable()
export class NotificationPlatformRetryBackoffCalculationPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryBackoffCalculationAnchorRepository,
    @Inject(NotificationPlatformRetryBackoffCalculationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryBackoffCalculationRecoveryStore,
  ) {}

  async loadNotificationPlatformRetryBackoffCalculationAnchor(
    workspaceId: string,
    calculationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffCalculationAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, calculationAnchorId);
    }
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
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
