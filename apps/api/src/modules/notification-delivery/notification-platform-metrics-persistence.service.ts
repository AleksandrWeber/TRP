import { Inject, Injectable } from '@nestjs/common';
import {
  buildNotificationPlatformMetricsAnchorState,
  type DurableNotificationPlatformMetricsAnchor,
  type NotificationPlatformMetricsAnchorPersistenceOutcome,
  type NotificationPlatformMetricsAnchorState,
} from './domain/durable-notification-platform-metrics-anchor';
import {
  NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY,
  type NotificationPlatformMetricsAnchorRepository,
} from './domain/notification-platform-metrics-anchor.repository';
import { NotificationPlatformMetricsRecoveryStore } from './domain/notification-platform-metrics-recovery-store';

export type PersistNotificationPlatformMetricsAnchorCommand = Readonly<{
  workspaceId: string;
  metricsAnchorId: string;
  platformMetricsType: string;
  metricsState?: NotificationPlatformMetricsAnchorState;
  channelScope?: string | null;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N16-b/c — durable Notification Platform Metrics anchor persistence on Notification Delivery owner.
 * W5-N16-c — write-through to recovery store after hydrate.
 * Storage only — no metrics collection, exporters, dashboards, runtime aggregation,
 * or operational continuity.
 */
@Injectable()
export class NotificationPlatformMetricsPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformMetricsAnchorRepository,
    @Inject(NotificationPlatformMetricsRecoveryStore)
    private readonly recoveryStore: NotificationPlatformMetricsRecoveryStore,
  ) {}

  async loadNotificationPlatformMetricsAnchor(
    workspaceId: string,
    metricsAnchorId: string,
  ): Promise<DurableNotificationPlatformMetricsAnchor | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, metricsAnchorId);
    }
    return this.repository.loadNotificationPlatformMetricsAnchor(workspaceId, metricsAnchorId);
  }

  async listAllNotificationPlatformMetricsAnchors(): Promise<
    readonly DurableNotificationPlatformMetricsAnchor[]
  > {
    return this.repository.listAllNotificationPlatformMetricsAnchors();
  }

  async persistNotificationPlatformMetricsAnchor(
    command: PersistNotificationPlatformMetricsAnchorCommand,
  ): Promise<NotificationPlatformMetricsAnchorPersistenceOutcome> {
    const prior = await this.loadNotificationPlatformMetricsAnchor(
      command.workspaceId,
      command.metricsAnchorId,
    );
    const outcome = buildNotificationPlatformMetricsAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformMetricsAnchor(outcome.anchor);
    this.recoveryStore.set(outcome.anchor);
    return outcome;
  }
}
