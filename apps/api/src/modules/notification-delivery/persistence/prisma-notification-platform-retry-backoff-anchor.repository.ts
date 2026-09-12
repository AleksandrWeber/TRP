import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetryBackoffAnchor,
  type NotificationPlatformRetryBackoffAnchorState,
} from '../domain/durable-notification-platform-retry-backoff-anchor';
import type { NotificationPlatformRetryBackoffAnchorRepository } from '../domain/notification-platform-retry-backoff-anchor.repository';

type NotificationPlatformRetryBackoffAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetryBackoffAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformRetryBackoffAnchorRepository implements NotificationPlatformRetryBackoffAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetryBackoffAnchor(
    anchor: DurableNotificationPlatformRetryBackoffAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetryBackoffAnchor.upsert({
      where: {
        workspaceId_retryBackoffAnchorId: {
          workspaceId: anchor.workspaceId,
          retryBackoffAnchorId: anchor.retryBackoffAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetryBackoffAnchor(
    workspaceId: string,
    retryBackoffAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformRetryBackoffAnchor.findUnique({
      where: {
        workspaceId_retryBackoffAnchorId: {
          workspaceId,
          retryBackoffAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetryBackoffAnchors(): Promise<
    readonly DurableNotificationPlatformRetryBackoffAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformRetryBackoffAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { retryBackoffAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetryBackoffAnchor,
): Prisma.WorkspaceNotificationPlatformRetryBackoffAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    retryBackoffAnchorId: anchor.retryBackoffAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryBackoffType: anchor.platformRetryBackoffType,
    retryBackoffState: anchor.retryBackoffState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetryBackoffAnchorRow,
): DurableNotificationPlatformRetryBackoffAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_BACKOFF_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry backoff anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    retryBackoffAnchorId: row.retryBackoffAnchorId,
    platformRetryBackoffType: row.platformRetryBackoffType,
    retryBackoffState: row.retryBackoffState as NotificationPlatformRetryBackoffAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
