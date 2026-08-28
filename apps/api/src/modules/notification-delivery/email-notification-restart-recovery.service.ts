import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableEmailNotificationAnchor } from './domain/durable-email-notification-anchor';
import {
  recordEmailNotificationRecoveryFailure,
  recordEmailNotificationRecoveryStart,
  recordEmailNotificationRecoverySuccess,
} from './domain/email-notification-continuity-status';
import {
  buildEmailNotificationRecoveryDiagnostics,
  prepareEmailNotificationAnchorsForRecovery,
  type EmailNotificationRecoveryDiagnostics,
} from './domain/email-notification-restart-recovery';
import {
  EMAIL_NOTIFICATION_ANCHOR_REPOSITORY,
  type EmailNotificationAnchorRepository,
} from './domain/email-notification-anchor.repository';
import { EmailNotificationRecoveryStore } from './email-notification-recovery-store';

/**
 * W5-N02-c — deterministic restart recovery for durable Email notification anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish SMTP transport or outbound notification delivery.
 */
@Injectable()
export class EmailNotificationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(EMAIL_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: EmailNotificationAnchorRepository,
    @Inject(EmailNotificationRecoveryStore)
    private readonly recoveryStore: EmailNotificationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<EmailNotificationRecoveryDiagnostics> {
    recordEmailNotificationRecoveryStart();
    try {
      const persisted = await this.repository.listAllEmailNotificationAnchors();
      const recovered = prepareEmailNotificationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildEmailNotificationRecoveryDiagnostics(recovered);
      recordEmailNotificationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordEmailNotificationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    notificationId: string,
  ): DurableEmailNotificationAnchor | null {
    return this.recoveryStore.get(workspaceId, notificationId);
  }

  getRecoveryDiagnostics(): EmailNotificationRecoveryDiagnostics {
    return buildEmailNotificationRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
