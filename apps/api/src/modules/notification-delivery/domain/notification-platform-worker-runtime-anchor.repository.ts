import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformWorkerRuntimeAnchor } from './durable-notification-platform-worker-runtime-anchor';

/**
 * Persistence port for durable Notification Platform Worker Runtime anchors (W5-N11-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformWorkerRuntimeAnchorRepository {
  saveNotificationPlatformWorkerRuntimeAnchor(
    anchor: DurableNotificationPlatformWorkerRuntimeAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformWorkerRuntimeAnchor(
    workspaceId: string,
    workerRuntimeAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerRuntimeAnchor | null>;

  /** Deterministic load for restart recovery (W5-N11-c). */
  listAllNotificationPlatformWorkerRuntimeAnchors(): Promise<
    readonly DurableNotificationPlatformWorkerRuntimeAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY',
);
