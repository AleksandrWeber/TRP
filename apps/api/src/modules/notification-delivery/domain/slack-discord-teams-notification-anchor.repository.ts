import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableSlackDiscordTeamsNotificationAnchor } from './durable-slack-discord-teams-notification-anchor';

/**
 * Persistence port for durable Slack / Discord / Teams notification anchors (W5-N03-b).
 * Implementations belong to notification-delivery infrastructure.
 */
export interface SlackDiscordTeamsNotificationAnchorRepository {
  saveSlackDiscordTeamsNotificationAnchor(
    anchor: DurableSlackDiscordTeamsNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadSlackDiscordTeamsNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableSlackDiscordTeamsNotificationAnchor | null>;

  /** Deterministic load for future restart recovery (W5-N03-c). */
  listAllSlackDiscordTeamsNotificationAnchors(): Promise<
    readonly DurableSlackDiscordTeamsNotificationAnchor[]
  >;
}

export const SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY = Symbol(
  'SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY',
);
