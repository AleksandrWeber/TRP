import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformIntegrationAnchor,
  type NotificationPlatformIntegrationAnchorState,
} from '../domain/durable-notification-platform-integration-anchor';
import type { NotificationPlatformIntegrationAnchorRepository } from '../domain/notification-platform-integration-anchor.repository';

type NotificationPlatformIntegrationAnchorRow =
  Prisma.WorkspaceNotificationPlatformIntegrationAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformIntegrationAnchorRepository implements NotificationPlatformIntegrationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformIntegrationAnchor(
    anchor: DurableNotificationPlatformIntegrationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformIntegrationAnchor.upsert({
      where: {
        workspaceId_integrationAnchorId: {
          workspaceId: anchor.workspaceId,
          integrationAnchorId: anchor.integrationAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformIntegrationAnchor(
    workspaceId: string,
    integrationAnchorId: string,
  ): Promise<DurableNotificationPlatformIntegrationAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformIntegrationAnchor.findUnique({
      where: {
        workspaceId_integrationAnchorId: {
          workspaceId,
          integrationAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformIntegrationAnchors(): Promise<
    readonly DurableNotificationPlatformIntegrationAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformIntegrationAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { integrationAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformIntegrationAnchor,
): Prisma.WorkspaceNotificationPlatformIntegrationAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    integrationAnchorId: anchor.integrationAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformIntegrationType: anchor.platformIntegrationType,
    integrationState: anchor.integrationState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformIntegrationAnchorRow,
): DurableNotificationPlatformIntegrationAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform integration anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    integrationAnchorId: row.integrationAnchorId,
    platformIntegrationType: row.platformIntegrationType,
    integrationState: row.integrationState as NotificationPlatformIntegrationAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
