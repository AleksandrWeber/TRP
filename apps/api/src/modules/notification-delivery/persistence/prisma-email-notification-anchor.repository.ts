import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  EMAIL_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
  type DurableEmailNotificationAnchor,
  type EmailNotificationAnchorDeliveryState,
} from '../domain/durable-email-notification-anchor';
import type { EmailNotificationAnchorRepository } from '../domain/email-notification-anchor.repository';

type EmailNotificationAnchorRow = Prisma.WorkspaceEmailNotificationAnchorGetPayload<
  Record<string, never>
>;

export class PrismaEmailNotificationAnchorRepository implements EmailNotificationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveEmailNotificationAnchor(
    anchor: DurableEmailNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceEmailNotificationAnchor.upsert({
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

  async loadEmailNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurableEmailNotificationAnchor | null> {
    const row = await this.prisma.workspaceEmailNotificationAnchor.findUnique({
      where: {
        workspaceId_notificationId: {
          workspaceId,
          notificationId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllEmailNotificationAnchors(): Promise<readonly DurableEmailNotificationAnchor[]> {
    const rows = await this.prisma.workspaceEmailNotificationAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { notificationId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableEmailNotificationAnchor,
): Prisma.WorkspaceEmailNotificationAnchorUncheckedCreateInput {
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

function toDomain(row: EmailNotificationAnchorRow): DurableEmailNotificationAnchor {
  if (row.schemaVersion !== EMAIL_NOTIFICATION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(`Unsupported email notification anchor schema version: ${row.schemaVersion}`);
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    notificationId: row.notificationId,
    notificationChannel: row.notificationChannel,
    notificationType: row.notificationType,
    recipientIdentifier: row.recipientIdentifier,
    templateIdentifier: row.templateIdentifier,
    deliveryState: row.deliveryState as EmailNotificationAnchorDeliveryState,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
