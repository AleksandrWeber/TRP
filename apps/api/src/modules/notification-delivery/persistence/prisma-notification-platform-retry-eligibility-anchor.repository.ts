import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetryEligibilityAnchor,
  type NotificationPlatformRetryEligibilityAnchorState,
} from '../domain/durable-notification-platform-retry-eligibility-anchor';
import type { NotificationPlatformRetryEligibilityAnchorRepository } from '../domain/notification-platform-retry-eligibility-anchor.repository';

type NotificationPlatformRetryEligibilityAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetryEligibilityAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformRetryEligibilityAnchorRepository implements NotificationPlatformRetryEligibilityAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetryEligibilityAnchor(
    anchor: DurableNotificationPlatformRetryEligibilityAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetryEligibilityAnchor.upsert({
      where: {
        workspaceId_eligibilityAnchorId: {
          workspaceId: anchor.workspaceId,
          eligibilityAnchorId: anchor.eligibilityAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetryEligibilityAnchor(
    workspaceId: string,
    eligibilityAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryEligibilityAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformRetryEligibilityAnchor.findUnique({
      where: {
        workspaceId_eligibilityAnchorId: {
          workspaceId,
          eligibilityAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetryEligibilityAnchors(): Promise<
    readonly DurableNotificationPlatformRetryEligibilityAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformRetryEligibilityAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { eligibilityAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetryEligibilityAnchor,
): Prisma.WorkspaceNotificationPlatformRetryEligibilityAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    eligibilityAnchorId: anchor.eligibilityAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryEligibilityType: anchor.platformRetryEligibilityType,
    eligibilityAnchorState: anchor.eligibilityAnchorState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetryEligibilityAnchorRow,
): DurableNotificationPlatformRetryEligibilityAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_ELIGIBILITY_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry eligibility anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    eligibilityAnchorId: row.eligibilityAnchorId,
    platformRetryEligibilityType: row.platformRetryEligibilityType,
    eligibilityAnchorState:
      row.eligibilityAnchorState as NotificationPlatformRetryEligibilityAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
