import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_WORKERS_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformWorkersAnchor,
  type NotificationPlatformWorkersAnchorState,
} from '../domain/durable-notification-platform-workers-anchor';
import type { NotificationPlatformWorkersAnchorRepository } from '../domain/notification-platform-workers-anchor.repository';

type NotificationPlatformWorkersAnchorRow =
  Prisma.WorkspaceNotificationPlatformWorkersAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformWorkersAnchorRepository implements NotificationPlatformWorkersAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformWorkersAnchor(
    anchor: DurableNotificationPlatformWorkersAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformWorkersAnchor.upsert({
      where: {
        workspaceId_workersAnchorId: {
          workspaceId: anchor.workspaceId,
          workersAnchorId: anchor.workersAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformWorkersAnchor(
    workspaceId: string,
    workersAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkersAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformWorkersAnchor.findUnique({
      where: {
        workspaceId_workersAnchorId: {
          workspaceId,
          workersAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformWorkersAnchors(): Promise<
    readonly DurableNotificationPlatformWorkersAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformWorkersAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { workersAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformWorkersAnchor,
): Prisma.WorkspaceNotificationPlatformWorkersAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    workersAnchorId: anchor.workersAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformWorkerType: anchor.platformWorkerType,
    workersState: anchor.workersState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformWorkersAnchorRow,
): DurableNotificationPlatformWorkersAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_WORKERS_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform workers anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    workersAnchorId: row.workersAnchorId,
    platformWorkerType: row.platformWorkerType,
    workersState: row.workersState as NotificationPlatformWorkersAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
