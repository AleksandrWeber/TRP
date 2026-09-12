import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetrySchedulingDecisionAnchor,
  type NotificationPlatformRetrySchedulingDecisionAnchorState,
} from '../domain/durable-notification-platform-retry-scheduling-decision-anchor';
import type { NotificationPlatformRetrySchedulingDecisionAnchorRepository } from '../domain/notification-platform-retry-scheduling-decision-anchor.repository';

type NotificationPlatformRetrySchedulingDecisionAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionAnchorGetPayload<
    Record<string, never>
  >;

export class PrismaNotificationPlatformRetrySchedulingDecisionAnchorRepository implements NotificationPlatformRetrySchedulingDecisionAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetrySchedulingDecisionAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetrySchedulingDecisionAnchor.upsert({
      where: {
        workspaceId_decisionAnchorId: {
          workspaceId: anchor.workspaceId,
          decisionAnchorId: anchor.decisionAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetrySchedulingDecisionAnchor(
    workspaceId: string,
    decisionAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionAnchor | null> {
    const row =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionAnchor.findUnique({
        where: {
          workspaceId_decisionAnchorId: {
            workspaceId,
            decisionAnchorId,
          },
        },
      });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetrySchedulingDecisionAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionAnchor[]
  > {
    const rows =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionAnchor.findMany({
        orderBy: [{ workspaceId: 'asc' }, { decisionAnchorId: 'asc' }],
      });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionAnchor,
): Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    decisionAnchorId: anchor.decisionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingDecisionType: anchor.platformRetrySchedulingDecisionType,
    decisionAnchorState: anchor.decisionAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetrySchedulingDecisionAnchorRow,
): DurableNotificationPlatformRetrySchedulingDecisionAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry scheduling decision anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    decisionAnchorId: row.decisionAnchorId,
    platformRetrySchedulingDecisionType: row.platformRetrySchedulingDecisionType,
    decisionAnchorState:
      row.decisionAnchorState as NotificationPlatformRetrySchedulingDecisionAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
