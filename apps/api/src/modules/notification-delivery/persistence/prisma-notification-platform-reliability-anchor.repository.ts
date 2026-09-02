import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformReliabilityAnchor,
  type NotificationPlatformReliabilityAnchorState,
} from '../domain/durable-notification-platform-reliability-anchor';
import type { NotificationPlatformReliabilityAnchorRepository } from '../domain/notification-platform-reliability-anchor.repository';

type NotificationPlatformReliabilityAnchorRow =
  Prisma.WorkspaceNotificationPlatformReliabilityAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformReliabilityAnchorRepository implements NotificationPlatformReliabilityAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformReliabilityAnchor(
    anchor: DurableNotificationPlatformReliabilityAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformReliabilityAnchor.upsert({
      where: {
        workspaceId_reliabilityAnchorId: {
          workspaceId: anchor.workspaceId,
          reliabilityAnchorId: anchor.reliabilityAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformReliabilityAnchor(
    workspaceId: string,
    reliabilityAnchorId: string,
  ): Promise<DurableNotificationPlatformReliabilityAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformReliabilityAnchor.findUnique({
      where: {
        workspaceId_reliabilityAnchorId: {
          workspaceId,
          reliabilityAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformReliabilityAnchors(): Promise<
    readonly DurableNotificationPlatformReliabilityAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformReliabilityAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { reliabilityAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformReliabilityAnchor,
): Prisma.WorkspaceNotificationPlatformReliabilityAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    reliabilityAnchorId: anchor.reliabilityAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformReliabilityType: anchor.platformReliabilityType,
    reliabilityState: anchor.reliabilityState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformReliabilityAnchorRow,
): DurableNotificationPlatformReliabilityAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RELIABILITY_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform reliability anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    reliabilityAnchorId: row.reliabilityAnchorId,
    platformReliabilityType: row.platformReliabilityType,
    reliabilityState: row.reliabilityState as NotificationPlatformReliabilityAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
