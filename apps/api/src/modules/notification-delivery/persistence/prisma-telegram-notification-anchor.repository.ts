import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  TELEGRAM_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
  type DurableTelegramNotificationAnchor,
  type TelegramNotificationAnchorDeliveryState,
} from '../domain/durable-telegram-notification-anchor';
import type { TelegramNotificationAnchorRepository } from '../domain/telegram-notification-anchor.repository';

type TelegramNotificationAnchorRow = Prisma.WorkspaceTelegramNotificationAnchorGetPayload<
  Record<string, never>
>;

export class PrismaTelegramNotificationAnchorRepository implements TelegramNotificationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveTelegramNotificationAnchor(
    anchor: DurableTelegramNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceTelegramNotificationAnchor.upsert({
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

  async loadTelegramNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableTelegramNotificationAnchor | null> {
    const row = await this.prisma.workspaceTelegramNotificationAnchor.findUnique({
      where: {
        workspaceId_notificationId: {
          workspaceId,
          notificationId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllTelegramNotificationAnchors(): Promise<
    readonly DurableTelegramNotificationAnchor[]
  > {
    const rows = await this.prisma.workspaceTelegramNotificationAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { notificationId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableTelegramNotificationAnchor,
): Prisma.WorkspaceTelegramNotificationAnchorUncheckedCreateInput {
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

function toDomain(row: TelegramNotificationAnchorRow): DurableTelegramNotificationAnchor {
  if (row.schemaVersion !== TELEGRAM_NOTIFICATION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported telegram notification anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    notificationId: row.notificationId,
    notificationChannel: row.notificationChannel,
    notificationType: row.notificationType,
    recipientIdentifier: row.recipientIdentifier,
    templateIdentifier: row.templateIdentifier,
    deliveryState: row.deliveryState as TelegramNotificationAnchorDeliveryState,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
