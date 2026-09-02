import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformTelemetryAnchor,
  type NotificationPlatformTelemetryAnchorState,
} from '../domain/durable-notification-platform-telemetry-anchor';
import type { NotificationPlatformTelemetryAnchorRepository } from '../domain/notification-platform-telemetry-anchor.repository';

type NotificationPlatformTelemetryAnchorRow =
  Prisma.WorkspaceNotificationPlatformTelemetryAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformTelemetryAnchorRepository implements NotificationPlatformTelemetryAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformTelemetryAnchor(
    anchor: DurableNotificationPlatformTelemetryAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformTelemetryAnchor.upsert({
      where: {
        workspaceId_telemetryAnchorId: {
          workspaceId: anchor.workspaceId,
          telemetryAnchorId: anchor.telemetryAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformTelemetryAnchor(
    workspaceId: string,
    telemetryAnchorId: string,
  ): Promise<DurableNotificationPlatformTelemetryAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformTelemetryAnchor.findUnique({
      where: {
        workspaceId_telemetryAnchorId: {
          workspaceId,
          telemetryAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformTelemetryAnchors(): Promise<
    readonly DurableNotificationPlatformTelemetryAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformTelemetryAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { telemetryAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformTelemetryAnchor,
): Prisma.WorkspaceNotificationPlatformTelemetryAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    telemetryAnchorId: anchor.telemetryAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformTelemetryType: anchor.platformTelemetryType,
    telemetryState: anchor.telemetryState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformTelemetryAnchorRow,
): DurableNotificationPlatformTelemetryAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_TELEMETRY_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform telemetry anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    telemetryAnchorId: row.telemetryAnchorId,
    platformTelemetryType: row.platformTelemetryType,
    telemetryState: row.telemetryState as NotificationPlatformTelemetryAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
