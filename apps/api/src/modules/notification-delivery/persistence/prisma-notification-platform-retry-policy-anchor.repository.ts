import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformRetryPolicyAnchor,
  type NotificationPlatformRetryPolicyAnchorState,
} from '../domain/durable-notification-platform-retry-policy-anchor';
import type { NotificationPlatformRetryPolicyAnchorRepository } from '../domain/notification-platform-retry-policy-anchor.repository';

type NotificationPlatformRetryPolicyAnchorRow =
  Prisma.WorkspaceNotificationPlatformRetryPolicyAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformRetryPolicyAnchorRepository implements NotificationPlatformRetryPolicyAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformRetryPolicyAnchor(
    anchor: DurableNotificationPlatformRetryPolicyAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformRetryPolicyAnchor.upsert({
      where: {
        workspaceId_retryPolicyAnchorId: {
          workspaceId: anchor.workspaceId,
          retryPolicyAnchorId: anchor.retryPolicyAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformRetryPolicyAnchor(
    workspaceId: string,
    retryPolicyAnchorId: string,
  ): Promise<DurableNotificationPlatformRetryPolicyAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformRetryPolicyAnchor.findUnique({
      where: {
        workspaceId_retryPolicyAnchorId: {
          workspaceId,
          retryPolicyAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformRetryPolicyAnchors(): Promise<
    readonly DurableNotificationPlatformRetryPolicyAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformRetryPolicyAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { retryPolicyAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformRetryPolicyAnchor,
): Prisma.WorkspaceNotificationPlatformRetryPolicyAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    retryPolicyAnchorId: anchor.retryPolicyAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryPolicyType: anchor.platformRetryPolicyType,
    retryPolicyState: anchor.retryPolicyState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformRetryPolicyAnchorRow,
): DurableNotificationPlatformRetryPolicyAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_RETRY_POLICY_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform retry policy anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    retryPolicyAnchorId: row.retryPolicyAnchorId,
    platformRetryPolicyType: row.platformRetryPolicyType,
    retryPolicyState: row.retryPolicyState as NotificationPlatformRetryPolicyAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
