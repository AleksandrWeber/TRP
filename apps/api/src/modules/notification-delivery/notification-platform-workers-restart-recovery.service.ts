import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformWorkersAnchor } from './domain/durable-notification-platform-workers-anchor';
import {
  recordNotificationPlatformWorkersRecoveryFailure,
  recordNotificationPlatformWorkersRecoveryStart,
  recordNotificationPlatformWorkersRecoverySuccess,
} from './domain/notification-platform-workers-continuity-status';
import {
  buildNotificationPlatformWorkersRecoveryDiagnostics,
  prepareNotificationPlatformWorkersAnchorsForRecovery,
  type NotificationPlatformWorkersRecoveryDiagnostics,
} from './domain/notification-platform-workers-restart-recovery';
import {
  NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY,
  type NotificationPlatformWorkersAnchorRepository,
} from './domain/notification-platform-workers-anchor.repository';
import { NotificationPlatformWorkersRecoveryStore } from './notification-platform-workers-recovery-store';

/**
 * W5-N09-c — deterministic restart recovery for durable Notification Platform Workers anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish platform workers execution, scheduler, retry, dead-letter processing, or orchestration.
 */
@Injectable()
export class NotificationPlatformWorkersRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformWorkersAnchorRepository,
    @Inject(NotificationPlatformWorkersRecoveryStore)
    private readonly recoveryStore: NotificationPlatformWorkersRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformWorkersRecoveryDiagnostics> {
    recordNotificationPlatformWorkersRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformWorkersAnchors();
      const recovered = prepareNotificationPlatformWorkersAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformWorkersRecoveryDiagnostics(recovered);
      recordNotificationPlatformWorkersRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformWorkersRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    workersAnchorId: string,
  ): DurableNotificationPlatformWorkersAnchor | null {
    return this.recoveryStore.get(workspaceId, workersAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformWorkersRecoveryDiagnostics {
    return buildNotificationPlatformWorkersRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
