import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformWorkerRuntimeAnchor } from './domain/durable-notification-platform-worker-runtime-anchor';
import {
  recordNotificationPlatformWorkerRuntimeRecoveryFailure,
  recordNotificationPlatformWorkerRuntimeRecoveryStart,
  recordNotificationPlatformWorkerRuntimeRecoverySuccess,
} from './domain/notification-platform-worker-runtime-continuity-status';
import {
  buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics,
  prepareNotificationPlatformWorkerRuntimeAnchorsForRecovery,
  type NotificationPlatformWorkerRuntimeRecoveryDiagnostics,
} from './domain/notification-platform-worker-runtime-restart-recovery';
import {
  NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY,
  type NotificationPlatformWorkerRuntimeAnchorRepository,
} from './domain/notification-platform-worker-runtime-anchor.repository';
import { NotificationPlatformWorkerRuntimeRecoveryStore } from './notification-platform-worker-runtime-recovery-store';

/**
 * W5-N11-c — deterministic restart recovery for durable Notification Platform Worker Runtime anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish worker runtime, scheduler, retry, dead-letter processing, orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformWorkerRuntimeRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkerRuntimeAnchorRepository,
    @Inject(NotificationPlatformWorkerRuntimeRecoveryStore)
    private readonly recoveryStore: NotificationPlatformWorkerRuntimeRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformWorkerRuntimeRecoveryDiagnostics> {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformWorkerRuntimeAnchors();
      const recovered = prepareNotificationPlatformWorkerRuntimeAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics(recovered);
      recordNotificationPlatformWorkerRuntimeRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformWorkerRuntimeRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    workerRuntimeAnchorId: string,
  ): DurableNotificationPlatformWorkerRuntimeAnchor | null {
    return this.recoveryStore.get(workspaceId, workerRuntimeAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformWorkerRuntimeRecoveryDiagnostics {
    return buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
