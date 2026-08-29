import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
  type DurableSlackDiscordTeamsNotificationAnchor,
  type SlackDiscordTeamsNotificationAnchorDeliveryState,
} from '../domain/durable-slack-discord-teams-notification-anchor';
import type { SlackDiscordTeamsNotificationAnchorRepository } from '../domain/slack-discord-teams-notification-anchor.repository';

type SlackDiscordTeamsNotificationAnchorRow =
  Prisma.WorkspaceSlackDiscordTeamsNotificationAnchorGetPayload<Record<string, never>>;

export class PrismaSlackDiscordTeamsNotificationAnchorRepository implements SlackDiscordTeamsNotificationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveSlackDiscordTeamsNotificationAnchor(
    anchor: DurableSlackDiscordTeamsNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceSlackDiscordTeamsNotificationAnchor.upsert({
      where: {
        workspaceId_notificationId: {
          workspaceId: anchor.workspaceId,
          notificationId: anchor.notificationId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadSlackDiscordTeamsNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableSlackDiscordTeamsNotificationAnchor | null> {
    const row = await this.prisma.workspaceSlackDiscordTeamsNotificationAnchor.findUnique({
      where: {
        workspaceId_notificationId: {
          workspaceId,
          notificationId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllSlackDiscordTeamsNotificationAnchors(): Promise<
    readonly DurableSlackDiscordTeamsNotificationAnchor[]
  > {
    const rows = await this.prisma.workspaceSlackDiscordTeamsNotificationAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { notificationId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableSlackDiscordTeamsNotificationAnchor,
): Prisma.WorkspaceSlackDiscordTeamsNotificationAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    notificationId: anchor.notificationId,
    schemaVersion: anchor.schemaVersion,
    notificationChannel: anchor.notificationChannel,
    notificationType: anchor.notificationType,
    recipientIdentifier: anchor.recipientIdentifier,
    templateIdentifier: anchor.templateIdentifier,
    deliveryState: anchor.deliveryState,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: SlackDiscordTeamsNotificationAnchorRow,
): DurableSlackDiscordTeamsNotificationAnchor {
  if (row.schemaVersion !== SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported slack/discord/teams notification anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    notificationId: row.notificationId,
    notificationChannel: row.notificationChannel,
    notificationType: row.notificationType,
    recipientIdentifier: row.recipientIdentifier,
    templateIdentifier: row.templateIdentifier,
    deliveryState: row.deliveryState as SlackDiscordTeamsNotificationAnchorDeliveryState,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
