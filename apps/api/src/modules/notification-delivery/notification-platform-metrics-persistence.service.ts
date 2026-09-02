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
 * W5-N16-b — durable Notification Platform Metrics anchor persistence on Notification Delivery owner.
 * Storage only — no metrics collection, exporters, dashboards, runtime aggregation,
 * recovery store, or operational continuity.
 */
@Injectable()
export class NotificationPlatformMetricsPersistenceService {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformMetricsAnchorRepository,
  ) {}

  async loadNotificationPlatformMetricsAnchor(
    workspaceId: string,
    metricsAnchorId: string,
  ): Promise<DurableNotificationPlatformMetricsAnchor | null> {
    return this.repository.loadNotificationPlatformMetricsAnchor(workspaceId, metricsAnchorId);
  }

  async persistNotificationPlatformMetricsAnchor(
    command: PersistNotificationPlatformMetricsAnchorCommand,
  ): Promise<NotificationPlatformMetricsAnchorPersistenceOutcome> {
    const prior = await this.repository.loadNotificationPlatformMetricsAnchor(
      command.workspaceId,
      command.metricsAnchorId,
    );
    const outcome = buildNotificationPlatformMetricsAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveNotificationPlatformMetricsAnchor(outcome.anchor);
    return outcome;
  }
}
