import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformDispatchAnchor } from './domain/durable-notification-platform-dispatch-anchor';
import {
  recordNotificationPlatformDispatchRecoveryFailure,
  recordNotificationPlatformDispatchRecoveryStart,
  recordNotificationPlatformDispatchRecoverySuccess,
} from './domain/notification-platform-dispatch-continuity-status';
import {
  buildNotificationPlatformDispatchRecoveryDiagnostics,
  prepareNotificationPlatformDispatchAnchorsForRecovery,
  type NotificationPlatformDispatchRecoveryDiagnostics,
} from './domain/notification-platform-dispatch-restart-recovery';
import {
  NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY,
  type NotificationPlatformDispatchAnchorRepository,
} from './domain/notification-platform-dispatch-anchor.repository';
import { NotificationPlatformDispatchRecoveryStore } from './notification-platform-dispatch-recovery-store';

/**
 * W5-N07-c — deterministic restart recovery for durable Notification Platform Dispatch anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish platform dispatch execution, dispatcher, queue workers, retry, or scheduler.
 */
@Injectable()
export class NotificationPlatformDispatchRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDispatchAnchorRepository,
    @Inject(NotificationPlatformDispatchRecoveryStore)
    private readonly recoveryStore: NotificationPlatformDispatchRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformDispatchRecoveryDiagnostics> {
    recordNotificationPlatformDispatchRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformDispatchAnchors();
      const recovered = prepareNotificationPlatformDispatchAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformDispatchRecoveryDiagnostics(recovered);
      recordNotificationPlatformDispatchRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformDispatchRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    dispatchAnchorId: string,
  ): DurableNotificationPlatformDispatchAnchor | null {
    return this.recoveryStore.get(workspaceId, dispatchAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformDispatchRecoveryDiagnostics {
    return buildNotificationPlatformDispatchRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
