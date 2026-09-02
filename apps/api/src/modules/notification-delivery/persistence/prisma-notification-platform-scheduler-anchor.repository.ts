import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformSchedulerAnchor,
  type NotificationPlatformSchedulerAnchorState,
} from '../domain/durable-notification-platform-scheduler-anchor';
import type { NotificationPlatformSchedulerAnchorRepository } from '../domain/notification-platform-scheduler-anchor.repository';

type NotificationPlatformSchedulerAnchorRow =
  Prisma.WorkspaceNotificationPlatformSchedulerAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformSchedulerAnchorRepository implements NotificationPlatformSchedulerAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformSchedulerAnchor(
    anchor: DurableNotificationPlatformSchedulerAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformSchedulerAnchor.upsert({
      where: {
        workspaceId_schedulerAnchorId: {
          workspaceId: anchor.workspaceId,
          schedulerAnchorId: anchor.schedulerAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformSchedulerAnchor(
    workspaceId: string,
    schedulerAnchorId: string,
  ): Promise<DurableNotificationPlatformSchedulerAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformSchedulerAnchor.findUnique({
      where: {
        workspaceId_schedulerAnchorId: {
          workspaceId,
          schedulerAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformSchedulerAnchors(): Promise<
    readonly DurableNotificationPlatformSchedulerAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformSchedulerAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { schedulerAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformSchedulerAnchor,
): Prisma.WorkspaceNotificationPlatformSchedulerAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    schedulerAnchorId: anchor.schedulerAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformSchedulerType: anchor.platformSchedulerType,
    schedulerState: anchor.schedulerState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformSchedulerAnchorRow,
): DurableNotificationPlatformSchedulerAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform scheduler anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schedulerAnchorId: row.schedulerAnchorId,
    platformSchedulerType: row.platformSchedulerType,
    schedulerState: row.schedulerState as NotificationPlatformSchedulerAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
