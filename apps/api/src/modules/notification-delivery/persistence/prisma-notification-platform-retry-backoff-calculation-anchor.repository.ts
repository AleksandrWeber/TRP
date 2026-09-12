import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetryBackoffCalculationAnchor,
  type NotificationPlatformRetryBackoffCalculationAnchorState,
} from '../domain/durable-notification-platform-retry-backoff-calculation-anchor';
import type { NotificationPlatformRetryBackoffCalculationAnchorRepository } from '../domain/notification-platform-retry-backoff-calculation-anchor.repository';

type NotificationPlatformRetryBackoffCalculationAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetryBackoffCalculationAnchorGetPayload<
    Record<string, never>
  >;

export class PrismaNotificationPlatformRetryBackoffCalculationAnchorRepository implements NotificationPlatformRetryBackoffCalculationAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetryBackoffCalculationAnchor(
    anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetryBackoffCalculationAnchor.upsert({
      where: {
        workspaceId_calculationAnchorId: {
          workspaceId: anchor.workspaceId,
          calculationAnchorId: anchor.calculationAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetryBackoffCalculationAnchor(
    workspaceId: string,
    calculationAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryBackoffCalculationAnchor | null> {
    const row =
      await this.prisma.workspaceNotificationPlatformRetryBackoffCalculationAnchor.findUnique({
        where: {
          workspaceId_calculationAnchorId: {
            workspaceId,
            calculationAnchorId,
          },
        },
      });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetryBackoffCalculationAnchors(): Promise<
    readonly DurableNotificationPlatformRetryBackoffCalculationAnchor[]
  > {
    const rows =
      await this.prisma.workspaceNotificationPlatformRetryBackoffCalculationAnchor.findMany({
        orderBy: [{ workspaceId: 'asc' }, { calculationAnchorId: 'asc' }],
      });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetryBackoffCalculationAnchor,
): Prisma.WorkspaceNotificationPlatformRetryBackoffCalculationAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    calculationAnchorId: anchor.calculationAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformBackoffCalculationType: anchor.platformBackoffCalculationType,
    calculationAnchorState: anchor.calculationAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetryBackoffCalculationAnchorRow,
): DurableNotificationPlatformRetryBackoffCalculationAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_BACKOFF_CALCULATION_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry backoff calculation anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    calculationAnchorId: row.calculationAnchorId,
    platformBackoffCalculationType: row.platformBackoffCalculationType,
    calculationAnchorState:
      row.calculationAnchorState as NotificationPlatformRetryBackoffCalculationAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
