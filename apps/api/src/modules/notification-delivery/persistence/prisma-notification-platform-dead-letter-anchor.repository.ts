import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_SCHEMA_VERSION,
  type DurableNotificationPlatformDeadLetterAnchor,
  type NotificationPlatformDeadLetterAnchorState,
} from '../domain/durable-notification-platform-dead-letter-anchor';
import type { NotificationPlatformDeadLetterAnchorRepository } from '../domain/notification-platform-dead-letter-anchor.repository';

type NotificationPlatformDeadLetterAnchorRow =
  Prisma.WorkspaceNotificationPlatformDeadLetterAnchorGetPayload<Record<string, never>>;

export class PrismaNotificationPlatformDeadLetterAnchorRepository implements NotificationPlatformDeadLetterAnchorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveNotificationPlatformDeadLetterAnchor(
    anchor: DurableNotificationPlatformDeadLetterAnchor,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(anchor);
    await client.workspaceNotificationPlatformDeadLetterAnchor.upsert({
      where: {
        workspaceId_deadLetterAnchorId: {
          workspaceId: anchor.workspaceId,
          deadLetterAnchorId: anchor.deadLetterAnchorId,
        },
      },
      create: data,
      update: data,
    });
  }

  async loadNotificationPlatformDeadLetterAnchor(
    workspaceId: string,
    deadLetterAnchorId: string,
  ): Promise<DurableNotificationPlatformDeadLetterAnchor | null> {
    const row = await this.prisma.workspaceNotificationPlatformDeadLetterAnchor.findUnique({
      where: {
        workspaceId_deadLetterAnchorId: {
          workspaceId,
          deadLetterAnchorId,
        },
      },
    });
    return row ? toDomain(row) : null;
  }

  async listAllNotificationPlatformDeadLetterAnchors(): Promise<
    readonly DurableNotificationPlatformDeadLetterAnchor[]
  > {
    const rows = await this.prisma.workspaceNotificationPlatformDeadLetterAnchor.findMany({
      orderBy: [{ workspaceId: 'asc' }, { deadLetterAnchorId: 'asc' }],
    });
    return Object.freeze(rows.map((row) => toDomain(row)));
  }
}

function toRow(
  anchor: DurableNotificationPlatformDeadLetterAnchor,
): Prisma.WorkspaceNotificationPlatformDeadLetterAnchorUncheckedCreateInput {
  return {
    workspaceId: anchor.workspaceId,
    deadLetterAnchorId: anchor.deadLetterAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformDeadLetterType: anchor.platformDeadLetterType,
    deadLetterState: anchor.deadLetterState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

function toDomain(
  row: NotificationPlatformDeadLetterAnchorRow,
): DurableNotificationPlatformDeadLetterAnchor {
  if (row.schemaVersion !== NOTIFICATION_PLATFORM_DEAD_LETTER_ANCHOR_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification platform dead-letter anchor schema version: ${row.schemaVersion}`,
    );
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    deadLetterAnchorId: row.deadLetterAnchorId,
    platformDeadLetterType: row.platformDeadLetterType,
    deadLetterState: row.deadLetterState as NotificationPlatformDeadLetterAnchorState,
    channelScope: row.channelScope,
    integrityMetadata: row.integrityMetadata,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    recordedAt: row.recordedAt.toISOString(),
    recordedByActorId: row.recordedByActorId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
