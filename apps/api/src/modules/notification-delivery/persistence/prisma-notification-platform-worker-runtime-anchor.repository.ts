import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformWorkerRuntimeAnchor,
  type NotificationPlatformWorkerRuntimeAnchorState,
} from '../domain/durable-notification-platform-worker-runtime-anchor';
import type { NotificationPlatformWorkerRuntimeAnchorRepository } from '../domain/notification-platform-worker-runtime-anchor.repository';

type NotificationPlatformWorkerRuntimeAnchorRow =
  Prisma.WorkspaceNotificationPlatformWorkerRuntimeAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformWorkerRuntimeAnchorRepository implements NotificationPlatformWorkerRuntimeAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformWorkerRuntimeAnchor(
    anchor: DurableNotificationPlatformWorkerRuntimeAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformWorkerRuntimeAnchor.upsert({
      where: {
        workspaceId_workerRuntimeAnchorId: {
          workspaceId: anchor.workspaceId,
          workerRuntimeAnchorId: anchor.workerRuntimeAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformWorkerRuntimeAnchor(
    workspaceId: string,
    workerRuntimeAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerRuntimeAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformWorkerRuntimeAnchor.findUnique({
      where: {
        workspaceId_workerRuntimeAnchorId: {
          workspaceId,
          workerRuntimeAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformWorkerRuntimeAnchors(): Promise<
    readonly DurableNotificationPlatformWorkerRuntimeAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformWorkerRuntimeAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { workerRuntimeAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformWorkerRuntimeAnchor,
): Prisma.WorkspaceNotificationPlatformWorkerRuntimeAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    workerRuntimeAnchorId: anchor.workerRuntimeAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformWorkerRuntimeType: anchor.platformWorkerRuntimeType,
    workerRuntimeState: anchor.workerRuntimeState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformWorkerRuntimeAnchorRow,
): DurableNotificationPlatformWorkerRuntimeAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform worker runtime anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    workerRuntimeAnchorId: row.workerRuntimeAnchorId,
    platformWorkerRuntimeType: row.platformWorkerRuntimeType,
    workerRuntimeState: row.workerRuntimeState as NotificationPlatformWorkerRuntimeAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
