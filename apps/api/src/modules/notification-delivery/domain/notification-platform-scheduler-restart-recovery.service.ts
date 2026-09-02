import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformSchedulerAnchor } from './durable-notification-platform-scheduler-anchor';
import {
  recordNotificationPlatformSchedulerRecoveryFailure,
  recordNotificationPlatformSchedulerRecoveryStart,
  recordNotificationPlatformSchedulerRecoverySuccess,
} from './notification-platform-scheduler-continuity-status';
import { NotificationPlatformSchedulerRecoveryStore } from './notification-platform-scheduler-recovery-store';
import {
  buildNotificationPlatformSchedulerRecoveryDiagnostics,
  prepareNotificationPlatformSchedulerAnchorsForRecovery,
  type NotificationPlatformSchedulerRecoveryDiagnostics,
} from './notification-platform-scheduler-restart-recovery';
import {
  NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY,
  type NotificationPlatformSchedulerAnchorRepository,
} from './notification-platform-scheduler-anchor.repository';

/**
 * W5-N12-c — deterministic restart recovery for durable Notification Platform Scheduler anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish scheduler runtime, scheduling engine, execution loop, retry, dead-letter processing,
 * orchestration, or operational continuity.
 */
@Injectable()
export class NotificationPlatformSchedulerRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformSchedulerAnchorRepository,
    @Inject(NotificationPlatformSchedulerRecoveryStore)
    private readonly recoveryStore: NotificationPlatformSchedulerRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformSchedulerRecoveryDiagnostics> {
    recordNotificationPlatformSchedulerRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformSchedulerAnchors();
      const recovered = prepareNotificationPlatformSchedulerAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformSchedulerRecoveryDiagnostics(recovered);
      recordNotificationPlatformSchedulerRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformSchedulerRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    schedulerAnchorId: string,
  ): DurableNotificationPlatformSchedulerAnchor | null {
    return this.recoveryStore.get(workspaceId, schedulerAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformSchedulerRecoveryDiagnostics {
    return buildNotificationPlatformSchedulerRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
