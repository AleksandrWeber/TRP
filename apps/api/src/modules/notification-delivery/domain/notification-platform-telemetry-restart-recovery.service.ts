import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformTelemetryAnchor } from './durable-notification-platform-telemetry-anchor';
import {
  recordNotificationPlatformTelemetryRecoveryFailure,
  recordNotificationPlatformTelemetryRecoveryStart,
  recordNotificationPlatformTelemetryRecoverySuccess,
} from './notification-platform-telemetry-continuity-status';
import { NotificationPlatformTelemetryRecoveryStore } from './notification-platform-telemetry-recovery-store';
import {
  buildNotificationPlatformTelemetryRecoveryDiagnostics,
  prepareNotificationPlatformTelemetryAnchorsForRecovery,
  type NotificationPlatformTelemetryRecoveryDiagnostics,
} from './notification-platform-telemetry-restart-recovery';
import {
  NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY,
  type NotificationPlatformTelemetryAnchorRepository,
} from './notification-platform-telemetry-anchor.repository';

/**
 * W5-N15-c — deterministic restart recovery for durable Notification Platform Telemetry anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish telemetry runtime, telemetry replay, telemetry processing, retry integration,
 * scheduler integration, workers, or operational continuity.
 */
@Injectable()
export class NotificationPlatformTelemetryRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformTelemetryAnchorRepository,
    @Inject(NotificationPlatformTelemetryRecoveryStore)
    private readonly recoveryStore: NotificationPlatformTelemetryRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformTelemetryRecoveryDiagnostics> {
    recordNotificationPlatformTelemetryRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformTelemetryAnchors();
      const recovered = prepareNotificationPlatformTelemetryAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformTelemetryRecoveryDiagnostics(recovered);
      recordNotificationPlatformTelemetryRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformTelemetryRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    telemetryAnchorId: string,
  ): DurableNotificationPlatformTelemetryAnchor | null {
    return this.recoveryStore.get(workspaceId, telemetryAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformTelemetryRecoveryDiagnostics {
    return buildNotificationPlatformTelemetryRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
