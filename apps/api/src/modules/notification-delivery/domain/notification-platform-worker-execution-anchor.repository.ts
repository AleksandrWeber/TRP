import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableNotificationPlatformWorkerExecutionAnchor } from './durable-notification-platform-worker-execution-anchor';

/**
 * Persistence port for durable Notification Platform Worker Execution anchors (W5-N10-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface NotificationPlatformWorkerExecutionAnchorRepository {
  saveNotificationPlatformWorkerExecutionAnchor(
    anchor: DurableNotificationPlatformWorkerExecutionAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadNotificationPlatformWorkerExecutionAnchor(
    workspaceId: string,
    workerExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerExecutionAnchor | null>;

  /** Deterministic load for restart recovery (W5-N10-c). */
  listAllNotificationPlatformWorkerExecutionAnchors(): Promise<
    readonly DurableNotificationPlatformWorkerExecutionAnchor[]
  >;
}

export const NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY = Symbol(
  'NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY',
);
