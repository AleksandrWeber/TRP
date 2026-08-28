import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableTelegramNotificationAnchor } from './domain/durable-telegram-notification-anchor';
import {
  recordTelegramNotificationRecoveryFailure,
  recordTelegramNotificationRecoveryStart,
  recordTelegramNotificationRecoverySuccess,
} from './domain/telegram-notification-continuity-status';
import {
  buildTelegramNotificationRecoveryDiagnostics,
  prepareTelegramNotificationAnchorsForRecovery,
  type TelegramNotificationRecoveryDiagnostics,
} from './domain/telegram-notification-restart-recovery';
import {
  TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY,
  type TelegramNotificationAnchorRepository,
} from './domain/telegram-notification-anchor.repository';
import { TelegramNotificationRecoveryStore } from './telegram-notification-recovery-store';

/**
 * W5-N01-c — deterministic restart recovery for durable Telegram notification anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish Bot API I/O or outbound notification delivery.
 */
@Injectable()
export class TelegramNotificationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: TelegramNotificationAnchorRepository,
    @Inject(TelegramNotificationRecoveryStore)
    private readonly recoveryStore: TelegramNotificationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<TelegramNotificationRecoveryDiagnostics> {
    recordTelegramNotificationRecoveryStart();
    try {
      const persisted = await this.repository.listAllTelegramNotificationAnchors();
      const recovered = prepareTelegramNotificationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildTelegramNotificationRecoveryDiagnostics(recovered);
      recordTelegramNotificationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordTelegramNotificationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    notificationId: string,
  ): DurableTelegramNotificationAnchor | null {
    return this.recoveryStore.get(workspaceId, notificationId);
  }

  getRecoveryDiagnostics(): TelegramNotificationRecoveryDiagnostics {
    return buildTelegramNotificationRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
