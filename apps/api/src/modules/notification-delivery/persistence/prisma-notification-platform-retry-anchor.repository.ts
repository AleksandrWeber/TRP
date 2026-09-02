import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetryAnchor,
  type NotificationPlatformRetryAnchorState,
} from '../domain/durable-notification-platform-retry-anchor';
import type { NotificationPlatformRetryAnchorRepository } from '../domain/notification-platform-retry-anchor.repository';

type NotificationPlatformRetryAnchorRow = Prisma.WorkspaceNotificationPlatformRetryAnchorGetPayload<
  Record<string, never>
>;

export class PrismaNotificationPlatformRetryAnchorRepository implements NotificationPlatformRetryAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetryAnchor(
    anchor: DurableNotificationPlatformRetryAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetryAnchor.upsert({
      where: {
        workspaceId_retryAnchorId: {
          workspaceId: anchor.workspaceId,
          retryAnchorId: anchor.retryAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetryAnchor(
    workspaceId: string,
    retryAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformRetryAnchor.findUnique({
      where: {
        workspaceId_retryAnchorId: {
          workspaceId,
          retryAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetryAnchors(): Promise<
    readonly DurableNotificationPlatformRetryAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformRetryAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { retryAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetryAnchor,
): Prisma.WorkspaceNotificationPlatformRetryAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    retryAnchorId: anchor.retryAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryType: anchor.platformRetryType,
    retryState: anchor.retryState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(row: NotificationPlatformRetryAnchorRow): DurableNotificationPlatformRetryAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    retryAnchorId: row.retryAnchorId,
    platformRetryType: row.platformRetryType,
    retryState: row.retryState as NotificationPlatformRetryAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
