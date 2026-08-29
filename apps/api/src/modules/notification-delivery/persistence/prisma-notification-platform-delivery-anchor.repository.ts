import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformDeliveryAnchor,
  type NotificationPlatformDeliveryAnchorState,
} from '../domain/durable-notification-platform-delivery-anchor';
import type { NotificationPlatformDeliveryAnchorRepository } from '../domain/notification-platform-delivery-anchor.repository';

type NotificationPlatformDeliveryAnchorRow =
  Prisma.WorkspaceNotificationPlatformDeliveryAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformDeliveryAnchorRepository implements NotificationPlatformDeliveryAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformDeliveryAnchor(
    anchor: DurableNotificationPlatformDeliveryAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformDeliveryAnchor.upsert({
      where: {
        workspaceId_deliveryAnchorId: {
          workspaceId: anchor.workspaceId,
          deliveryAnchorId: anchor.deliveryAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformDeliveryAnchor(
    workspaceId: string,
    deliveryAnchorId: string,
  ): Promise<DurableNotificationPlatformDeliveryAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformDeliveryAnchor.findUnique({
      where: {
        workspaceId_deliveryAnchorId: {
          workspaceId,
          deliveryAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformDeliveryAnchors(): Promise<
    readonly DurableNotificationPlatformDeliveryAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformDeliveryAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { deliveryAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformDeliveryAnchor,
): Prisma.WorkspaceNotificationPlatformDeliveryAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    deliveryAnchorId: anchor.deliveryAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformDeliveryType: anchor.platformDeliveryType,
    deliveryState: anchor.deliveryState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformDeliveryAnchorRow,
): DurableNotificationPlatformDeliveryAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform delivery anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    deliveryAnchorId: row.deliveryAnchorId,
    platformDeliveryType: row.platformDeliveryType,
    deliveryState: row.deliveryState as NotificationPlatformDeliveryAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
