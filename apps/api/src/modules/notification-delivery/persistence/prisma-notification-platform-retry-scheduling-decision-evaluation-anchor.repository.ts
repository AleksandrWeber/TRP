import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
  type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState,
} from '../domain/durable-notification-platform-retry-scheduling-decision-evaluation-anchor';
import type { NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository } from '../domain/notification-platform-retry-scheduling-decision-evaluation-anchor.repository';

type NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionEvaluationAnchorGetPayload<
    Record<string, never>
  >;

export class PrismaNotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository implements NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
    anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetrySchedulingDecisionEvaluationAnchor.upsert({
      where: {
        workspaceId_evaluationAnchorId: {
          workspaceId: anchor.workspaceId,
          evaluationAnchorId: anchor.evaluationAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetrySchedulingDecisionEvaluationAnchor(
    workspaceId: string,
    evaluationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor | null> {
    const row =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionEvaluationAnchor.findUnique(
        {
          where: {
            workspaceId_evaluationAnchorId: {
              workspaceId,
              evaluationAnchorId,
            },
          },
        },
      );
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetrySchedulingDecisionEvaluationAnchors(): Promise<
    readonly DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor[]
  > {
    const rows =
      await this.prisma.workspaceNotificationPlatformRetrySchedulingDecisionEvaluationAnchor.findMany(
        {
          orderBy: [{ workspaceId: 'asc' }, { evaluationAnchorId: 'asc' }],
        },
      );
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor,
): Prisma.WorkspaceNotificationPlatformRetrySchedulingDecisionEvaluationAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    evaluationAnchorId: anchor.evaluationAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetrySchedulingDecisionEvaluationType:
      anchor.platformRetrySchedulingDecisionEvaluationType,
    evaluationAnchorState: anchor.evaluationAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetrySchedulingDecisionEvaluationAnchorRow,
): DurableNotificationPlatformRetrySchedulingDecisionEvaluationAnchor {
  if (
    row.schemaVersion !==
    NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_EVALUATION_ANCHOR_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported notification platform retry scheduling decision evaluation anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    evaluationAnchorId: row.evaluationAnchorId,
    platformRetrySchedulingDecisionEvaluationType:
      row.platformRetrySchedulingDecisionEvaluationType,
    evaluationAnchorState:
      row.evaluationAnchorState as NotificationPlatformRetrySchedulingDecisionEvaluationAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
