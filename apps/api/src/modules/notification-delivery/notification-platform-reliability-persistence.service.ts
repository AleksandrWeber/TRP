import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformReliabilityAnchorState,
  type DurableNotificationPlatformReliabilityAnchor,
  type NotificationPlatformReliabilityAnchorPersistenceOutcome,
  type NotificationPlatformReliabilityAnchorState,
} from './domain/durable-notification-platform-reliability-anchor';
import {
  NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_REPOSITORY,
  type NotificationPlatformReliabilityAnchorRepository,
} from './domain/notification-platform-reliability-anchor.repository';
import { NotificationPlatformReliabilityRecoveryStore } from './domain/notification-platform-reliability-recovery-store';

export type PersistNotificationPlatformReliabilityAnchorCommand = Readonly<{
  workspaceId: string;
  reliabilityAnchorId: string;
  platformReliabilityType: string;
  reliabilityState?: NotificationPlatformReliabilityAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N17-b — durable Notification Platform Delivery Reliability anchor persistence on Notification Delivery owner.
 * Storage only — no delivery execution runtime, restart recovery hydrate, operational continuity,
 * retry execution, or transport I/O.
 */
@Injectable()
export class NotificationPlatformReliabilityPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformReliabilityAnchorRepository,
    @Inject(NotificationPlatformReliabilityRecoveryStore)
    private readonly recoveryStore: NotificationPlatformReliabilityRecoveryStore,
  ) {}

  async loadNotificationPlatformReliabilityAnchor(
    workspaceId: string,
    reliabilityAnchorId: string,
  ): Promise<DurableNotificationPlatformReliabilityAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, reliabilityAnchorId);
    }
    return this.repository.loadNotificationPlatformReliabilityAnchor(
      workspaceId,
      reliabilityAnchorId,
    );
  }

  async listAllNotificationPlatformReliabilityAnchors(): Promise<
    readonly DurableNotificationPlatformReliabilityAnchor[]
  > {
    return this.repository.listAllNotificationPlatformReliabilityAnchors();
  }

  async persistNotificationPlatformReliabilityAnchor(
    command: PersistNotificationPlatformReliabilityAnchorCommand,
  ): Promise<NotificationPlatformReliabilityAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformReliabilityAnchor(
      command.workspaceId,
      command.reliabilityAnchorId,
    );
    const outcome = buildNotificationPlatformReliabilityAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformReliabilityAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
