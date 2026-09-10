import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetryExecutionAnchor,
  type NotificationPlatformRetryExecutionAnchorState,
} from '../domain/durable-notification-platform-retry-execution-anchor';
import type { NotificationPlatformRetryExecutionAnchorRepository } from '../domain/notification-platform-retry-execution-anchor.repository';

type NotificationPlatformRetryExecutionAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetryExecutionAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformRetryExecutionAnchorRepository implements NotificationPlatformRetryExecutionAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetryExecutionAnchor(
    anchor: DurableNotificationPlatformRetryExecutionAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetryExecutionAnchor.upsert({
      where: {
        workspaceId_retryExecutionAnchorId: {
          workspaceId: anchor.workspaceId,
          retryExecutionAnchorId: anchor.retryExecutionAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetryExecutionAnchor(
    workspaceId: string,
    retryExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryExecutionAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformRetryExecutionAnchor.findUnique({
      where: {
        workspaceId_retryExecutionAnchorId: {
          workspaceId,
          retryExecutionAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetryExecutionAnchors(): Promise<
    readonly DurableNotificationPlatformRetryExecutionAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformRetryExecutionAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { retryExecutionAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetryExecutionAnchor,
): Prisma.WorkspaceNotificationPlatformRetryExecutionAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    retryExecutionAnchorId: anchor.retryExecutionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryExecutionType: anchor.platformRetryExecutionType,
    retryExecutionState: anchor.retryExecutionState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetryExecutionAnchorRow,
): DurableNotificationPlatformRetryExecutionAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_EXECUTION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry execution anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    retryExecutionAnchorId: row.retryExecutionAnchorId,
    platformRetryExecutionType: row.platformRetryExecutionType,
    retryExecutionState: row.retryExecutionState as NotificationPlatformRetryExecutionAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
