import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  PUSH_NOTIFICATION_ANCHOR_SCHEMA_VERSION,
  type DurablePushNotificationAnchor,
  type PushNotificationAnchorDeliveryState,
} from '../domain/durable-push-notification-anchor';
import type { PushNotificationAnchorRepository } from '../domain/push-notification-anchor.repository';

type PushNotificationAnchorRow = Prisma.WorkspacePushNotificationAnchorGetPayload<
  Record<string, never>
>;

export class PrismaPushNotificationAnchorRepository implements PushNotificationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async savePushNotificationAnchor(
    anchor: DurablePushNotificationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspacePushNotificationAnchor.upsert({
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

  async loadPushNotificationAnchor(
    workspaceId: string,
    notificationId: string,
  ): Promise<DurablePushNotificationAnchor | null> {
    const row = await this.prisma.workspacePushNotificationAnchor.findUnique({
      where: {
        workspaceId_notificationId: {
          workspaceId,
          notificationId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllPushNotificationAnchors(): Promise<readonly DurablePushNotificationAnchor[]> {
    const rows = await this.prisma.workspacePushNotificationAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { notificationId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurablePushNotificationAnchor,
): Prisma.WorkspacePushNotificationAnchorUncheckedCreateInput {
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

function toDomain(row: PushNotificationAnchorRow): DurablePushNotificationAnchor {
  if (row.schemaVersion !== PUSH_NOTIFICATION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(`Unsupported push notification anchor schema version: ${row.schemaVersion}`);
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    notificationId: row.notificationId,
    notificationChannel: row.notificationChannel,
    notificationType: row.notificationType,
    recipientIdentifier: row.recipientIdentifier,
    templateIdentifier: row.templateIdentifier,
    deliveryState: row.deliveryState as PushNotificationAnchorDeliveryState,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
