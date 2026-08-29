import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurablePushNotificationAnchor } from './domain/durable-push-notification-anchor';
import {
  recordPushNotificationRecoveryFailure,
  recordPushNotificationRecoveryStart,
  recordPushNotificationRecoverySuccess,
} from './domain/push-notification-continuity-status';
import {
  buildPushNotificationRecoveryDiagnostics,
  preparePushNotificationAnchorsForRecovery,
  type PushNotificationRecoveryDiagnostics,
} from './domain/push-notification-restart-recovery';
import {
  PUSH_NOTIFICATION_ANCHOR_REPOSITORY,
  type PushNotificationAnchorRepository,
} from './domain/push-notification-anchor.repository';
import { PushNotificationRecoveryStore } from './push-notification-recovery-store';

/**
 * W5-N04-c — deterministic restart recovery for durable Push notification anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish Web Push/FCM transport or outbound notification delivery.
 */
@Injectable()
export class PushNotificationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(PUSH_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: PushNotificationAnchorRepository,
    @Inject(PushNotificationRecoveryStore)
    private readonly recoveryStore: PushNotificationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<PushNotificationRecoveryDiagnostics> {
    recordPushNotificationRecoveryStart();
    try {
      const persisted = await this.repository.listAllPushNotificationAnchors();
      const recovered = preparePushNotificationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildPushNotificationRecoveryDiagnostics(recovered);
      recordPushNotificationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordPushNotificationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    notificationId: string,
  ): DurablePushNotificationAnchor | null {
    return this.recoveryStore.get(workspaceId, notificationId);
  }

  getRecoveryDiagnostics(): PushNotificationRecoveryDiagnostics {
    return buildPushNotificationRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
