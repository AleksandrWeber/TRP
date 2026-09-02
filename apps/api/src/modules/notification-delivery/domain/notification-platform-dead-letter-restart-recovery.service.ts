import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableNotificationPlatformDeadLetterAnchor } from './durable-notification-platform-dead-letter-anchor';
import {
  recordNotificationPlatformDeadLetterRecoveryFailure,
  recordNotificationPlatformDeadLetterRecoveryStart,
  recordNotificationPlatformDeadLetterRecoverySuccess,
} from './notification-platform-dead-letter-continuity-status';
import { NotificationPlatformDeadLetterRecoveryStore } from './notification-platform-dead-letter-recovery-store';
import {
  buildNotificationPlatformDeadLetterRecoveryDiagnostics,
  prepareNotificationPlatformDeadLetterAnchorsForRecovery,
  type NotificationPlatformDeadLetterRecoveryDiagnostics,
} from './notification-platform-dead-letter-restart-recovery';
import {
  NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_REPOSITORY,
  type NotificationPlatformDeadLetterAnchorRepository,
} from './notification-platform-dead-letter-anchor.repository';

/**
 * W5-N14-c — deterministic restart recovery for durable Notification Platform Dead Letter anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish dead-letter runtime, dead-letter replay, dead-letter processing, retry integration,
 * scheduler integration, workers, or operational continuity.
 */
@Injectable()
export class NotificationPlatformDeadLetterRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_REPOSITORY)
    private readonly repository: NotificationPlatformDeadLetterAnchorRepository,
    @Inject(NotificationPlatformDeadLetterRecoveryStore)
    private readonly recoveryStore: NotificationPlatformDeadLetterRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<NotificationPlatformDeadLetterRecoveryDiagnostics> {
    recordNotificationPlatformDeadLetterRecoveryStart();
    try {
      const persisted = await this.repository.listAllNotificationPlatformDeadLetterAnchors();
      const recovered = prepareNotificationPlatformDeadLetterAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildNotificationPlatformDeadLetterRecoveryDiagnostics(recovered);
      recordNotificationPlatformDeadLetterRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordNotificationPlatformDeadLetterRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    deadLetterAnchorId: string,
  ): DurableNotificationPlatformDeadLetterAnchor | null {
    return this.recoveryStore.get(workspaceId, deadLetterAnchorId);
  }

  getRecoveryDiagnostics(): NotificationPlatformDeadLetterRecoveryDiagnostics {
    return buildNotificationPlatformDeadLetterRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
