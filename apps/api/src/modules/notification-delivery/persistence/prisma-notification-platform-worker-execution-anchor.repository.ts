import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformWorkerExecutionAnchor,
  type NotificationPlatformWorkerExecutionAnchorState,
} from '../domain/durable-notification-platform-worker-execution-anchor';
import type { NotificationPlatformWorkerExecutionAnchorRepository } from '../domain/notification-platform-worker-execution-anchor.repository';

type NotificationPlatformWorkerExecutionAnchorRow =
  Prisma.WorkspaceNotificationPlatformWorkerExecutionAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformWorkerExecutionAnchorRepository implements NotificationPlatformWorkerExecutionAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformWorkerExecutionAnchor(
    anchor: DurableNotificationPlatformWorkerExecutionAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformWorkerExecutionAnchor.upsert({
      where: {
        workspaceId_workerExecutionAnchorId: {
          workspaceId: anchor.workspaceId,
          workerExecutionAnchorId: anchor.workerExecutionAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformWorkerExecutionAnchor(
    workspaceId: string,
    workerExecutionAnchorId: string,
  ): Promise<DurableNotificationPlatformWorkerExecutionAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformWorkerExecutionAnchor.findUnique({
      where: {
        workspaceId_workerExecutionAnchorId: {
          workspaceId,
          workerExecutionAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformWorkerExecutionAnchors(): Promise<
    readonly DurableNotificationPlatformWorkerExecutionAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformWorkerExecutionAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { workerExecutionAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformWorkerExecutionAnchor,
): Prisma.WorkspaceNotificationPlatformWorkerExecutionAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    workerExecutionAnchorId: anchor.workerExecutionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformWorkerExecutionType: anchor.platformWorkerExecutionType,
    workerExecutionState: anchor.workerExecutionState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformWorkerExecutionAnchorRow,
): DurableNotificationPlatformWorkerExecutionAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform worker execution anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    workerExecutionAnchorId: row.workerExecutionAnchorId,
    platformWorkerExecutionType: row.platformWorkerExecutionType,
    workerExecutionState:
      row.workerExecutionState as NotificationPlatformWorkerExecutionAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
