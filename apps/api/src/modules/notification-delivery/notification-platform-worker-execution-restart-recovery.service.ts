import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformWorkerExecutionAnchor } from './domain/durable-notification-platform-worker-execution-anchor';
import {
  recordNotificationPlatformWorkerExecutionRecoveryFailure,
  recordNotificationPlatformWorkerExecutionRecoveryStart,
  recordNotificationPlatformWorkerExecutionRecoverySuccess,
} from './domain/notification-platform-worker-execution-continuity-status';
import {
  buildNotificationPlatformWorkerExecutionRecoveryDiagnostics,
  prepareNotificationPlatformWorkerExecutionAnchorsForRecovery,
  type NotificationPlatformWorkerExecutionRecoveryDiagnostics,
} from './domain/notification-platform-worker-execution-restart-recovery';
import {
  NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY,
  type NotificationPlatformWorkerExecutionAnchorRepository,
} from './domain/notification-platform-worker-execution-anchor.repository';
import { NotificationPlatformWorkerExecutionRecoveryStore } from './notification-platform-worker-execution-recovery-store';

/**
 * W5-N10-c — deterministic restart recovery for durable Notification Platform Worker Execution anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish worker runtime, scheduler, retry, dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformWorkerExecutionRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkerExecutionAnchorRepository,
    @Inject(NotificationPlatformWorkerExecutionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformWorkerExecutionRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformWorkerExecutionRecoveryDiagnostics> {
    recordNotificationPlatformWorkerExecutionRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformWorkerExecutionAnchors();
      const recovered = prepareNotificationPlatformWorkerExecutionAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformWorkerExecutionRecoveryDiagnostics(recovered);
      recordNotificationPlatformWorkerExecutionRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformWorkerExecutionRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    workerExecutionAnchorId: string,
  ): DurableNotificationPlatformWorkerExecutionAnchor | null {
    return this.recoveryStore.get(workspaceId, workerExecutionAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformWorkerExecutionRecoveryDiagnostics {
    return buildNotificationPlatformWorkerExecutionRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
