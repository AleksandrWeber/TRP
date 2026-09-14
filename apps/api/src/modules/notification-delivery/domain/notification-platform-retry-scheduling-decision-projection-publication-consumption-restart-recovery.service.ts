import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';
import {
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess,
} from './notification-platform-retry-scheduling-decision-projection-publication-consumption-continuity-status';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore } from './notification-platform-retry-scheduling-decision-projection-publication-consumption-recovery-store';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics,
  prepareNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsForRecovery,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics,
} from './notification-platform-retry-scheduling-decision-projection-publication-consumption-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository,
} from './notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor.repository';

/**
 * W5-N29-c — deterministic restart recovery for durable Notification Platform Retry
 * Scheduling Decision Projection Publication Consumption anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish runtime consumption, runtime publication, runtime decision projection, operational continuity, scheduling, eligibility,
 * backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(
      NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_REPOSITORY,
    )
    private readonly repository: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository,
    @Inject(
      NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore,
    )
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics> {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart();
    try {
      const persisted =
        await this.repository.listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchors();
      const recovered =
        prepareNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorsForRecovery(
          persisted,
        );
      this.recoveryStore.replaceAll(recovered);
      const diagnostics =
        buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
          recovered,
        );
      recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess(
        {
          diagnostics,
          reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
        },
      );
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryFailure(
        {
          reason,
        },
      );
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    consumptionAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor | null {
    return this.recoveryStore.get(workspaceId, consumptionAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics {
    return buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
