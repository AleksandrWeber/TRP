import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_QUEUE_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformQueueAnchor,
  type NotificationPlatformQueueAnchorState,
} from '../domain/durable-notification-platform-queue-anchor';
import type { NotificationPlatformQueueAnchorRepository } from '../domain/notification-platform-queue-anchor.repository';

type NotificationPlatformQueueAnchorRow = Prisma.WorkspaceNotificationPlatformQueueAnchorGetPayload<
  Record<string, never>
>;

export class PrismaNotificationPlatformQueueAnchorRepository implements NotificationPlatformQueueAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformQueueAnchor(
    anchor: DurableNotificationPlatformQueueAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformQueueAnchor.upsert({
      where: {
        workspaceId_queueAnchorId: {
          workspaceId: anchor.workspaceId,
          queueAnchorId: anchor.queueAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformQueueAnchor(
    workspaceId: string,
    queueAnchorId: string,
  ): Promise<DurableNotificationPlatformQueueAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformQueueAnchor.findUnique({
      where: {
        workspaceId_queueAnchorId: {
          workspaceId,
          queueAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformQueueAnchors(): Promise<
    readonly DurableNotificationPlatformQueueAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformQueueAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { queueAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformQueueAnchor,
): Prisma.WorkspaceNotificationPlatformQueueAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    queueAnchorId: anchor.queueAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformQueueType: anchor.platformQueueType,
    queueState: anchor.queueState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(row: NotificationPlatformQueueAnchorRow): DurableNotificationPlatformQueueAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_QUEUE_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform queue anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    queueAnchorId: row.queueAnchorId,
    platformQueueType: row.platformQueueType,
    queueState: row.queueState as NotificationPlatformQueueAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
