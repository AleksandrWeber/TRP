import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetryBackoffCalculationAnchor } from './durable-notification-platform-retry-backoff-calculation-anchor';
import {
  recordNotificationPlatformRetryBackoffCalculationRecoveryFailure,
  recordNotificationPlatformRetryBackoffCalculationRecoveryStart,
  recordNotificationPlatformRetryBackoffCalculationRecoverySuccess,
} from './notification-platform-retry-backoff-calculation-continuity-status';
import { NotificationPlatformRetryBackoffCalculationRecoveryStore } from './notification-platform-retry-backoff-calculation-recovery-store';
import {
  buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics,
  prepareNotificationPlatformRetryBackoffCalculationAnchorsForRecovery,
  type NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics,
} from './notification-platform-retry-backoff-calculation-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryBackoffCalculationAnchorRepository,
} from './notification-platform-retry-backoff-calculation-anchor.repository';

/**
 * W5-N22-c — deterministic restart recovery for durable Notification Platform Retry Backoff
 * Calculation anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish calculation runtime, operational continuity, scheduling, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetryBackoffCalculationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryBackoffCalculationAnchorRepository,
    @Inject(NotificationPlatformRetryBackoffCalculationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryBackoffCalculationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics> {
    recordNotificationPlatformRetryBackoffCalculationRecoveryStart();
    try {
      const persisted =
        await this.repository.listAllNotificationPlatformRetryBackoffCalculationAnchors();
      const recovered =
        prepareNotificationPlatformRetryBackoffCalculationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics =
        buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetryBackoffCalculationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetryBackoffCalculationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    calculationAnchorId: string,
  ): DurableNotificationPlatformRetryBackoffCalculationAnchor | null {
    return this.recoveryStore.get(workspaceId, calculationAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics {
    return buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
