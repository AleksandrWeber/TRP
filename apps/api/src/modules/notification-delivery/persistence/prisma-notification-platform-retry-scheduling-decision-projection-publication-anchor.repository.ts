import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState,
} from '../domain/durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';
import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository } from '../domain/notification-platform-retry-scheduling-decision-projection-publication-anchor.repository';

type NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorGetPayload<
    Record<string, never>
  >;

export class PrismaNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository implements NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor.upsert(
      {
        where: {
          workspaceId_publicationAnchorId: {
            workspaceId: anchor.workspaceId,
            publicationAnchorId: anchor.publicationAnchorId,
          },
        },
        create: data,
        update: data,
      },
    );
  }

  async loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor(
    workspaceId: string,
    publicationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor | null> {
    const row =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor.findUnique(
        {
          where: {
            workspaceId_publicationAnchorId: {
              workspaceId,
              publicationAnchorId,
            },
          },
        },
      );
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor[]
  > {
    const rows =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor.findMany(
        {
          orderBy: [{ workspaceId: 'asc' }, { publicationAnchorId: 'asc' }],
        },
      );
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor,
): Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    publicationAnchorId: anchor.publicationAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingDecisionProjectionPublicationType:
      anchor.platformRetrySchedulingDecisionProjectionPublicationType,
    publicationAnchorState: anchor.publicationAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorRow,
): DurableNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchor {
  if (
    row.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported notification platform retry scheduling decision projection publication anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    publicationAnchorId: row.publicationAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationType:
      row.platformRetrySchedulingDecisionProjectionPublicationType,
    publicationAnchorState:
      row.publicationAnchorState as NotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
