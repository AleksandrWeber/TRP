import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState,
} from '../domain/durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';
import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository } from '../domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor.repository';

type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorGetPayload<
    Record<string, never>
  >;

export class PrismaNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository implements NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor.upsert(
      {
        where: {
          workspaceId_consumptionAnchorId: {
            workspaceId: anchor.workspaceId,
            consumptionAnchorId: anchor.consumptionAnchorId,
          },
        },
        create: data,
        update: data,
      },
    );
  }

  async loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
    workspaceId: string,
    consumptionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor | null> {
    const row =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor.findUnique(
        {
          where: {
            workspaceId_consumptionAnchorId: {
              workspaceId,
              consumptionAnchorId,
            },
          },
        },
      );
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor[]
  > {
    const rows =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor.findMany(
        {
          orderBy: [{ workspaceId: 'asc' }, { consumptionAnchorId: 'asc' }],
        },
      );
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor,
): Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    consumptionAnchorId: anchor.consumptionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
      anchor.platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    consumptionAnchorState: anchor.consumptionAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRow,
): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor {
  if (
    row.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported notification platform retry scheduling decision projection publication consumption anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    consumptionAnchorId: row.consumptionAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
      row.platformRetrySchedulingDecisionProjectionPublicationConsumptionType,
    consumptionAnchorState:
      row.consumptionAnchorState as NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
