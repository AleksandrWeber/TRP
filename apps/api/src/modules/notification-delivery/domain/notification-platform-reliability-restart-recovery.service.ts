import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformReliabilityAnchor } from './durable-notification-platform-reliability-anchor';
import {
  recordNotificationPlatformReliabilityRecoveryFailure,
  recordNotificationPlatformReliabilityRecoveryStart,
  recordNotificationPlatformReliabilityRecoverySuccess,
} from './notification-platform-reliability-continuity-status';
import { NotificationPlatformReliabilityRecoveryStore } from './notification-platform-reliability-recovery-store';
import {
  buildNotificationPlatformReliabilityRecoveryDiagnostics,
  prepareNotificationPlatformReliabilityAnchorsForRecovery,
  type NotificationPlatformReliabilityRecoveryDiagnostics,
} from './notification-platform-reliability-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_REPOSITORY,
  type NotificationPlatformReliabilityAnchorRepository,
} from './notification-platform-reliability-anchor.repository';

/**
 * W5-N17-c — deterministic restart recovery for durable Notification Platform Delivery Reliability anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish delivery execution runtime, retry execution, operational continuity, or transport I/O.
 */
@Injectable()
export class NotificationPlatformReliabilityRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformReliabilityAnchorRepository,
    @Inject(NotificationPlatformReliabilityRecoveryStore)
    private readonly recoveryStore: NotificationPlatformReliabilityRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformReliabilityRecoveryDiagnostics> {
    recordNotificationPlatformReliabilityRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformReliabilityAnchors();
      const recovered = prepareNotificationPlatformReliabilityAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformReliabilityRecoveryDiagnostics(recovered);
      recordNotificationPlatformReliabilityRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformReliabilityRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    reliabilityAnchorId: string,
  ): DurableNotificationPlatformReliabilityAnchor | null {
    return this.recoveryStore.get(workspaceId, reliabilityAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformReliabilityRecoveryDiagnostics {
    return buildNotificationPlatformReliabilityRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
