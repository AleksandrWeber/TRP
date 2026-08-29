import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformIntegrationAnchor } from './durable-notification-platform-integration-anchor';

/**
 * Persistence port for durable Notification Platform Integration anchors (W5-N05-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformIntegrationAnchorRepository {
  saveNotificationPlatformIntegrationAnchor(
    anchor: DurableNotificationPlatformIntegrationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformIntegrationAnchor(
    workspaceId: string,
    integrationAnchorId: string,
  ): Promise<DurableNotificationPlatformIntegrationAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N05-c). */
  listAllNotificationPlatformIntegrationAnchors(): Promise<
    readonly DurableNotificationPlatformIntegrationAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY',
);
