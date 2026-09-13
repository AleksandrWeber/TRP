import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
  type NotificationPlatformRetrySchedulingDecisionProjectionAnchorState,
} from '../domain/durable-notification-platform-retry-scheduling-decision-projection-anchor';
import type { NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository } from '../domain/notification-platform-retry-scheduling-decision-projection-anchor.repository';

type NotificationPlatformRetrySchedulingDecisionProjectionAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchorGetPayload<
    Record<string, never>
  >;

export class PrismaNotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository implements NotificationPlatformRetrySchedulingDecisionProjectionAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchor.upsert({
      where: {
        workspaceId_projectionAnchorId: {
          workspaceId: anchor.workspaceId,
          projectionAnchorId: anchor.projectionAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetrySchedulingDecisionProjectionAnchor(
    workspaceId: string,
    projectionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor | null> {
    const row =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchor.findUnique(
        {
          where: {
            workspaceId_projectionAnchorId: {
              workspaceId,
              projectionAnchorId,
            },
          },
        },
      );
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetrySchedulingDecisionProjectionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor[]
  > {
    const rows =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchor.findMany(
        {
          orderBy: [{ workspaceId: 'asc' }, { projectionAnchorId: 'asc' }],
        },
      );
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor,
): Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionProjectionAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    projectionAnchorId: anchor.projectionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingDecisionProjectionType:
      anchor.platformRetrySchedulingDecisionProjectionType,
    projectionAnchorState: anchor.projectionAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetrySchedulingDecisionProjectionAnchorRow,
): DurableNotificationPlatformRetrySchedulingDecisionProjectionAnchor {
  if (
    row.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported notification platform retry scheduling decision projection anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    projectionAnchorId: row.projectionAnchorId,
    platformRetrySchedulingDecisionProjectionType:
      row.platformRetrySchedulingDecisionProjectionType,
    projectionAnchorState:
      row.projectionAnchorState as NotificationPlatformRetrySchedulingDecisionProjectionAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
