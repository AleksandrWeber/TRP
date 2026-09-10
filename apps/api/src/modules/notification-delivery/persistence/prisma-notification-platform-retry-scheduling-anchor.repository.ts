import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetrySchedulingAnchor,
  type NotificationPlatformRetrySchedulingAnchorState,
} from '../domain/durable-notification-platform-retry-scheduling-anchor';
import type { NotificationPlatformRetrySchedulingAnchorRepository } from '../domain/notification-platform-retry-scheduling-anchor.repository';

type NotificationPlatformRetrySchedulingAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetrySchedulingAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformRetrySchedulingAnchorRepository implements NotificationPlatformRetrySchedulingAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetrySchedulingAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetrySchedulingAnchor.upsert({
      where: {
        workspaceId_retrySchedulingAnchorId: {
          workspaceId: anchor.workspaceId,
          retrySchedulingAnchorId: anchor.retrySchedulingAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetrySchedulingAnchor(
    workspaceId: string,
    retrySchedulingAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformRetrySchedulingAnchor.findUnique({
      where: {
        workspaceId_retrySchedulingAnchorId: {
          workspaceId,
          retrySchedulingAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetrySchedulingAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformRetrySchedulingAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { retrySchedulingAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetrySchedulingAnchor,
): Prisma.WorkspaceNotificationPlatformRetrySchedulingAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    retrySchedulingAnchorId: anchor.retrySchedulingAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingType: anchor.platformRetrySchedulingType,
    retrySchedulingState: anchor.retrySchedulingState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetrySchedulingAnchorRow,
): DurableNotificationPlatformRetrySchedulingAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_SCHEDULING_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry scheduling anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    retrySchedulingAnchorId: row.retrySchedulingAnchorId,
    platformRetrySchedulingType: row.platformRetrySchedulingType,
    retrySchedulingState:
      row.retrySchedulingState as NotificationPlatformRetrySchedulingAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
