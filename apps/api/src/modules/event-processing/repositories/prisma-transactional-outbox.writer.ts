import type { Prisma, PrismaClient } from '@prisma/client';
import type { AcceptedMarketStreamState } from '../domain/accepted-market-stream-state';
import type { DurableEventEnvelope } from '../domain/durable-event-envelope';
import { toDurableEventId } from '../domain/durable-event-id';
import { OutboxStatus } from '../domain/outbox-status';
import type { OutboxRecord } from '../domain/outbox-record';
import type {
  AcceptMarketEventCommand,
  AcceptMarketEventResult,
  TransactionalOutboxWriter,
} from '../transactional-outbox-writer';

/**
 * PostgreSQL transactional Outbox writer (US149 / ADR-013).
 * Accepted stream state is reconstructed from the latest Outbox row for the stream —
 * both commit or neither; rollback cannot leave an orphan Outbox event.
 */
export class PrismaTransactionalOutboxWriter implements TransactionalOutboxWriter {
  constructor(private readonly prisma: PrismaClient) {}

  async acceptMarketEvent(command: AcceptMarketEventCommand): Promise<AcceptMarketEventResult> {
    assertEnvelope(command.envelope);

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.outboxEvent.create({
          data: envelopeToCreate(command.envelope, command.recordedAt),
        });
        // Force failure path support for tests via optional hook is not needed —
        // transaction abort is validated separately.
        return created;
      });

      return {
        state: Object.freeze({ ...command.state }),
        outbox: toOutboxRecord(row),
      };
    } catch (error) {
      const orphan = await this.prisma.outboxEvent.findUnique({
        where: { eventId: String(command.envelope.eventId) },
      });
      if (orphan) {
        throw new Error(
          `orphan outbox event after failed transaction: ${command.envelope.eventId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Commit Outbox + optional after-write hook inside one transaction.
   * If the hook throws, the Outbox insert is rolled back.
   */
  async acceptMarketEventOrRollback(
    command: AcceptMarketEventCommand,
    afterWrite?: () => void | Promise<void>,
  ): Promise<AcceptMarketEventResult> {
    assertEnvelope(command.envelope);

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.outboxEvent.create({
        data: envelopeToCreate(command.envelope, command.recordedAt),
      });
      await afterWrite?.();
      return created;
    });

    return {
      state: Object.freeze({ ...command.state }),
      outbox: toOutboxRecord(row),
    };
  }

  async getAcceptedState(
    workspaceId: string,
    streamId: string,
  ): Promise<AcceptedMarketStreamState | null> {
    const row = await this.prisma.outboxEvent.findFirst({
      where: {
        workspaceId,
        aggregateType: 'MarketStream',
        aggregateId: streamId,
      },
      orderBy: { aggregateVersion: 'desc' },
    });
    if (!row) return null;
    const payload =
      row.payload !== null && typeof row.payload === 'object' && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};
    return Object.freeze({
      workspaceId: row.workspaceId,
      streamId: row.aggregateId,
      lastSequence: row.aggregateVersion,
      lastEventId: row.eventId,
      lastOccurredAt: row.occurredAt.toISOString(),
      updatedAt:
        typeof payload.recordedAt === 'string' ? payload.recordedAt : row.updatedAt.toISOString(),
    });
  }
}

function envelopeToCreate(
  envelope: DurableEventEnvelope,
  createdAt: string,
): Prisma.OutboxEventCreateInput {
  return {
    eventId: String(envelope.eventId),
    eventType: envelope.eventType,
    schemaVersion: envelope.schemaVersion,
    aggregateType: envelope.aggregateType,
    aggregateId: envelope.aggregateId,
    aggregateVersion: envelope.aggregateVersion,
    workspaceId: envelope.workspaceId,
    occurredAt: new Date(envelope.occurredAt),
    recordedAt: new Date(envelope.recordedAt),
    correlationId: envelope.correlationId ?? null,
    causationId: envelope.causationId ?? null,
    actorId: envelope.actorId ?? null,
    payload: envelope.payload as Prisma.InputJsonValue,
    status: 'pending',
    attempts: 0,
    lastError: null,
    nextAttemptAt: null,
    publishedAt: null,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
  };
}

function toOutboxRecord(row: {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  workspaceId: string;
  occurredAt: Date;
  recordedAt: Date;
  correlationId: string | null;
  causationId: string | null;
  actorId: string | null;
  payload: unknown;
  status: string;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): OutboxRecord {
  const payload =
    row.payload !== null && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    envelope: Object.freeze({
      eventId: toDurableEventId(row.eventId),
      eventType: row.eventType,
      schemaVersion: row.schemaVersion,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      aggregateVersion: row.aggregateVersion,
      workspaceId: row.workspaceId,
      occurredAt: row.occurredAt.toISOString(),
      recordedAt: row.recordedAt.toISOString(),
      ...(row.correlationId !== null ? { correlationId: row.correlationId } : {}),
      ...(row.causationId !== null ? { causationId: row.causationId } : {}),
      ...(row.actorId !== null ? { actorId: row.actorId } : {}),
      payload: Object.freeze({ ...payload }),
    }),
    status: row.status as OutboxStatus,
    attempts: row.attempts,
    lastError: row.lastError,
    nextAttemptAt: row.nextAttemptAt !== null ? row.nextAttemptAt.toISOString() : null,
    publishedAt: row.publishedAt !== null ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function assertEnvelope(envelope: DurableEventEnvelope): void {
  const required: Array<keyof DurableEventEnvelope> = [
    'eventId',
    'eventType',
    'schemaVersion',
    'aggregateType',
    'aggregateId',
    'aggregateVersion',
    'workspaceId',
    'occurredAt',
    'recordedAt',
    'payload',
  ];
  for (const field of required) {
    const value = envelope[field];
    if (value === undefined || value === null || value === '') {
      throw new Error(`durable envelope missing required field: ${field}`);
    }
  }
}
