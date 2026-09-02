import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_METRICS_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformMetricsAnchor,
  type NotificationPlatformMetricsAnchorState,
} from '../domain/durable-notification-platform-metrics-anchor';
import type { NotificationPlatformMetricsAnchorRepository } from '../domain/notification-platform-metrics-anchor.repository';

type NotificationPlatformMetricsAnchorRow =
  Prisma.WorkspaceNotificationPlatformMetricsAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformMetricsAnchorRepository implements NotificationPlatformMetricsAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformMetricsAnchor(
    anchor: DurableNotificationPlatformMetricsAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformMetricsAnchor.upsert({
      where: {
        workspaceId_metricsAnchorId: {
          workspaceId: anchor.workspaceId,
          metricsAnchorId: anchor.metricsAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformMetricsAnchor(
    workspaceId: string,
    metricsAnchorId: string,
  ): Promise<DurableNotificationPlatformMetricsAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformMetricsAnchor.findUnique({
      where: {
        workspaceId_metricsAnchorId: {
          workspaceId,
          metricsAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformMetricsAnchors(): Promise<
    readonly DurableNotificationPlatformMetricsAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformMetricsAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { metricsAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformMetricsAnchor,
): Prisma.WorkspaceNotificationPlatformMetricsAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    metricsAnchorId: anchor.metricsAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformMetricsType: anchor.platformMetricsType,
    metricsState: anchor.metricsState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformMetricsAnchorRow,
): DurableNotificationPlatformMetricsAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_METRICS_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform metrics anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    metricsAnchorId: row.metricsAnchorId,
    platformMetricsType: row.platformMetricsType,
    metricsState: row.metricsState as NotificationPlatformMetricsAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
