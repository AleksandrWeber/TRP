import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformMetricsAnchor } from './durable-notification-platform-metrics-anchor';
import {
  recordNotificationPlatformMetricsRecoveryFailure,
  recordNotificationPlatformMetricsRecoveryStart,
  recordNotificationPlatformMetricsRecoverySuccess,
} from './notification-platform-metrics-continuity-status';
import { NotificationPlatformMetricsRecoveryStore } from './notification-platform-metrics-recovery-store';
import {
  buildNotificationPlatformMetricsRecoveryDiagnostics,
  prepareNotificationPlatformMetricsAnchorsForRecovery,
  type NotificationPlatformMetricsRecoveryDiagnostics,
} from './notification-platform-metrics-restart-recovery';
import {
  NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY,
  type NotificationPlatformMetricsAnchorRepository,
} from './notification-platform-metrics-anchor.repository';

/**
 * W5-N16-c — deterministic restart recovery for durable Notification Platform Metrics anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish metrics collection runtime, metrics aggregation, exporter integration, retry integration,
 * scheduler integration, workers, or operational continuity.
 */
@Injectable()
export class NotificationPlatformMetricsRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_METRICS_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformMetricsAnchorRepository,
    @Inject(NotificationPlatformMetricsRecoveryStore)
    private readonly recoveryStore: NotificationPlatformMetricsRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformMetricsRecoveryDiagnostics> {
    recordNotificationPlatformMetricsRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformMetricsAnchors();
      const recovered = prepareNotificationPlatformMetricsAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformMetricsRecoveryDiagnostics(recovered);
      recordNotificationPlatformMetricsRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformMetricsRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    metricsAnchorId: string,
  ): DurableNotificationPlatformMetricsAnchor | null {
    return this.recoveryStore.get(workspaceId, metricsAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformMetricsRecoveryDiagnostics {
    return buildNotificationPlatformMetricsRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
