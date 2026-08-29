import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformDispatchAnchor,
  type NotificationPlatformDispatchAnchorState,
} from '../domain/durable-notification-platform-dispatch-anchor';
import type { NotificationPlatformDispatchAnchorRepository } from '../domain/notification-platform-dispatch-anchor.repository';

type NotificationPlatformDispatchAnchorRow =
  Prisma.WorkspaceNotificationPlatformDispatchAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformDispatchAnchorRepository implements NotificationPlatformDispatchAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformDispatchAnchor(
    anchor: DurableNotificationPlatformDispatchAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformDispatchAnchor.upsert({
      where: {
        workspaceId_dispatchAnchorId: {
          workspaceId: anchor.workspaceId,
          dispatchAnchorId: anchor.dispatchAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformDispatchAnchor(
    workspaceId: string,
    dispatchAnchorId: string,
  ): Promise<DurableNotificationPlatformDispatchAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformDispatchAnchor.findUnique({
      where: {
        workspaceId_dispatchAnchorId: {
          workspaceId,
          dispatchAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformDispatchAnchors(): Promise<
    readonly DurableNotificationPlatformDispatchAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformDispatchAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { dispatchAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformDispatchAnchor,
): Prisma.WorkspaceNotificationPlatformDispatchAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    dispatchAnchorId: anchor.dispatchAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformDispatchType: anchor.platformDispatchType,
    dispatchState: anchor.dispatchState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformDispatchAnchorRow,
): DurableNotificationPlatformDispatchAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform dispatch anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    dispatchAnchorId: row.dispatchAnchorId,
    platformDispatchType: row.platformDispatchType,
    dispatchState: row.dispatchState as NotificationPlatformDispatchAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
