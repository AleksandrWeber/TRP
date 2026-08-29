import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableSlackDiscordTeamsNotificationAnchor } from './domain/durable-slack-discord-teams-notification-anchor';
import {
  recordSlackDiscordTeamsNotificationRecoveryFailure,
  recordSlackDiscordTeamsNotificationRecoveryStart,
  recordSlackDiscordTeamsNotificationRecoverySuccess,
} from './domain/slack-discord-teams-notification-continuity-status';
import {
  buildSlackDiscordTeamsNotificationRecoveryDiagnostics,
  prepareSlackDiscordTeamsNotificationAnchorsForRecovery,
  type SlackDiscordTeamsNotificationRecoveryDiagnostics,
} from './domain/slack-discord-teams-notification-restart-recovery';
import {
  SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY,
  type SlackDiscordTeamsNotificationAnchorRepository,
} from './domain/slack-discord-teams-notification-anchor.repository';
import { SlackDiscordTeamsNotificationRecoveryStore } from './slack-discord-teams-notification-recovery-store';

/**
 * W5-N03-c — deterministic restart recovery for durable Slack / Discord / Teams notification anchors.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish webhook transport or outbound notification delivery.
 */
@Injectable()
export class SlackDiscordTeamsNotificationRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: SlackDiscordTeamsNotificationAnchorRepository,
    @Inject(SlackDiscordTeamsNotificationRecoveryStore)
    private readonly recoveryStore: SlackDiscordTeamsNotificationRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<SlackDiscordTeamsNotificationRecoveryDiagnostics> {
    recordSlackDiscordTeamsNotificationRecoveryStart();
    try {
      const persisted = await this.repository.listAllSlackDiscordTeamsNotificationAnchors();
      const recovered = prepareSlackDiscordTeamsNotificationAnchorsForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildSlackDiscordTeamsNotificationRecoveryDiagnostics(recovered);
      recordSlackDiscordTeamsNotificationRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordSlackDiscordTeamsNotificationRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredAnchor(
    workspaceId: string,
    notificationId: string,
  ): DurableSlackDiscordTeamsNotificationAnchor | null {
    return this.recoveryStore.get(workspaceId, notificationId);
  }

  getRecoveryDiagnostics(): SlackDiscordTeamsNotificationRecoveryDiagnostics {
    return buildSlackDiscordTeamsNotificationRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
