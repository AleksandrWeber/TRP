import { Inject, Injectable } from '@nestjs/common';
import {
  buildSlackDiscordTeamsNotificationAnchorState,
  type DurableSlackDiscordTeamsNotificationAnchor,
  type SlackDiscordTeamsNotificationAnchorDeliveryState,
  type SlackDiscordTeamsNotificationAnchorPersistenceOutcome,
} from './domain/durable-slack-discord-teams-notification-anchor';
import {
  SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY,
  type SlackDiscordTeamsNotificationAnchorRepository,
} from './domain/slack-discord-teams-notification-anchor.repository';

export type PersistSlackDiscordTeamsNotificationAnchorCommand = Readonly<{
  workspaceId: string;
  notificationId: string;
  notificationChannel: string;
  notificationType: string;
  recipientIdentifier?: string | null;
  templateIdentifier?: string | null;
  deliveryState?: SlackDiscordTeamsNotificationAnchorDeliveryState;
  correlationId?: string | null;
  actorId?: string | null;
  recordedAt: string;
}>;

/**
 * W5-N03-b — durable Slack / Discord / Teams notification anchor persistence on Notification Delivery owner.
 * Storage only — no webhook I/O, outbound delivery, or restart recovery.
 */
@Injectable()
export class SlackDiscordTeamsNotificationPersistenceService {
  constructor(
    @Inject(SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY)
    private readonly repository: SlackDiscordTeamsNotificationAnchorRepository,
  ) {}

  async loadAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableSlackDiscordTeamsNotificationAnchor | null> {
    return this.repository.loadSlackDiscordTeamsNotificationAnchor(workspaceId, notificationId);
  }

  async persistNotificationAnchor(
    command: PersistSlackDiscordTeamsNotificationAnchorCommand,
  ): Promise<SlackDiscordTeamsNotificationAnchorPersistenceOutcome> {
    const prior = await this.loadAnchor(command.workspaceId, command.notificationId);
    const outcome = buildSlackDiscordTeamsNotificationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveSlackDiscordTeamsNotificationAnchor(outcome.anchor);
    return outcome;
  }
}
