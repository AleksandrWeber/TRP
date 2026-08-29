import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformIntegrationAnchor } from './domain/durable-notification-platform-integration-anchor';
import {
  recordNotificationPlatformIntegrationRecoveryFailure,
  recordNotificationPlatformIntegrationRecoveryStart,
  recordNotificationPlatformIntegrationRecoverySuccess,
} from './domain/notification-platform-integration-continuity-status';
import {
  buildNotificationPlatformIntegrationRecoveryDiagnostics,
  prepareNotificationPlatformIntegrationAnchorsForRecovery,
  type NotificationPlatformIntegrationRecoveryDiagnostics,
} from './domain/notification-platform-integration-restart-recovery';
import {
  NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY,
  type NotificationPlatformIntegrationAnchorRepository,
} from './domain/notification-platform-integration-anchor.repository';
import { NotificationPlatformIntegrationRecoveryStore } from './notification-platform-integration-recovery-store';

/**
 * W5-N05-c — deterministic restart recovery for durable Notification Platform Integration anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish platform integration I/O or cross-channel delivery unification.
 */
@Injectable()
export class NotificationPlatformIntegrationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformIntegrationAnchorRepository,
    @Inject(NotificationPlatformIntegrationRecoveryStore)
    private readonly recoveryStore: NotificationPlatformIntegrationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformIntegrationRecoveryDiagnostics> {
    recordNotificationPlatformIntegrationRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformIntegrationAnchors();
      const recovered = prepareNotificationPlatformIntegrationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformIntegrationRecoveryDiagnostics(recovered);
      recordNotificationPlatformIntegrationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformIntegrationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    integrationAnchorId: string,
  ): DurableNotificationPlatformIntegrationAnchor | null {
    return this.recoveryStore.get(workspaceId, integrationAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformIntegrationRecoveryDiagnostics {
    return buildNotificationPlatformIntegrationRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
