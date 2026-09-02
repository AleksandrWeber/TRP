import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformTelemetryAnchor } from './durable-notification-platform-telemetry-anchor';

/**
 * Persistence port for durable Notification Platform Telemetry anchors (W5-N15-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformTelemetryAnchorRepository {
  saveNotificationPlatformTelemetryAnchor(
    anchor: DurableNotificationPlatformTelemetryAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformTelemetryAnchor(
    workspaceId: string,
    telemetryAnchorId: string,
  ): Promise<DurableNotificationPlatformTelemetryAnchor | null>;

  /** Deterministic load for restart recovery (W5-N15-c). */
  listAllNotificationPlatformTelemetryAnchors(): Promise<
    readonly DurableNotificationPlatformTelemetryAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY',
);
