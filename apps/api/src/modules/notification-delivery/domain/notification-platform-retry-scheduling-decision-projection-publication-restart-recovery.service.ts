import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor } from './durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';
import {
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess,
} from './notification-platform-retry-scheduling-decision-projection-publication-continuity-status';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore } from './notification-platform-retry-scheduling-decision-projection-publication-recovery-store';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics,
  prepareNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsForRecovery,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics,
} from './notification-platform-retry-scheduling-decision-projection-publication-restart-recovery';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_REPOSITORY,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository,
} from './notification-platform-retry-scheduling-decision-projection-publication-anchor.repository';

/**
 * W5-N28-c — deterministic restart recovery for durable Notification Platform Retry
 * Scheduling Decision Projection Publication anchors. Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish runtime publication, runtime decision projection, operational continuity, scheduling, eligibility,
 * backoff calculation, or transport I/O.
 */
@Injectable()
export class NotificationPlatformRetrySchedulingDecisionProjectionPublicationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(
      NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_REPOSITORY,
    )
    private readonly repository: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository,
    @Inject(NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics> {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart();
    try {
      const persisted =
        await this.repository.listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchors();
      const recovered =
        prepareNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorsForRecovery(
          persisted,
        );
      this.recoveryStore.replaceAll(recovered);
      const diagnostics =
        buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics(
          recovered,
        );
      recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryFailure({
        reason,
      });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    publicationAnchorId: string,
  ): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor | null {
    return this.recoveryStore.get(workspaceId, publicationAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics {
    return buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics(
      this.recoveryStore.snapshot(),
    );
  }
}
