import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetryExecutionAnchor } from './durable-notification-platform-retry-execution-anchor';
import {
  recordNotificationPlatformRetryExecutionRecoveryFailure,
  recordNotificationPlatformRetryExecutionRecoveryStart,
  recordNotificationPlatformRetryExecutionRecoverySuccess,
} from './notification-platform-retry-execution-continuity-status';
import { NotificationPlatformRetryExecutionRecoveryStore } from './notification-platform-retry-execution-recovery-store';
import {
  buildNotificationPlatformRetryExecutionRecoveryDiagnostics,
  prepareNotificationPlatformRetryExecutionAnchorsForRecovery,
  type NotificationPlatformRetryExecutionRecoveryDiagnostics,
} from './notification-platform-retry-execution-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetryExecutionAnchorRepository,
} from './notification-platform-retry-execution-anchor.repository';

/**
 * W5-N18-c — deterministic restart recovery for durable Notification Platform Retry Execution anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish retry execution runtime, operational continuity, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetryExecutionRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformRetryExecutionAnchorRepository,
    @Inject(NotificationPlatformRetryExecutionRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetryExecutionRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetryExecutionRecoveryDiagnostics> {
    recordNotificationPlatformRetryExecutionRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformRetryExecutionAnchors();
      const recovered = prepareNotificationPlatformRetryExecutionAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformRetryExecutionRecoveryDiagnostics(recovered);
      recordNotificationPlatformRetryExecutionRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetryExecutionRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    retryExecutionAnchorId: string,
  ): DurableNotificationPlatformRetryExecutionAnchor | null {
    return this.recoveryStore.get(workspaceId, retryExecutionAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetryExecutionRecoveryDiagnostics {
    return buildNotificationPlatformRetryExecutionRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
