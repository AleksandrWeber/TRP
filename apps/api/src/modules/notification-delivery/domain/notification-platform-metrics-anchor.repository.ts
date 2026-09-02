import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformMetricsAnchor } from './durable-notification-platform-metrics-anchor';

/**
 * Persistence port for durable Notification Platform Metrics anchors (W5-N16-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformMetricsAnchorRepository {
  saveNotificationPlatformMetricsAnchor(
    anchor: DurableNotificationPlatformMetricsAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformMetricsAnchor(
    workspaceId: string,
    metricsAnchorId: string,
  ): Promise<DurableNotificationPlatformMetricsAnchor | null>;

  /** Deterministic load for restart recovery (W5-N16-c). */
  listAllNotificationPlatformMetricsAnchors(): Promise<
    readonly DurableNotificationPlatformMetricsAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY',
);
