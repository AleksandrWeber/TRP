import type { OutboxDeliveryStatus, Prisma } from '@prisma/client';
import { toDurableEventId } from '../domain/durable-event-id';
import type { DurableEventEnvelope } from '../domain/durable-event-envelope';
import type { OutboxDeliveryPatch, OutboxRecord } from '../domain/outbox-record';
import { OutboxStatus } from '../domain/outbox-status';
import type { OutboxRepository, UnpublishedOutboxQuery } from './outbox.repository';
import type { PrismaOutboxClient } from './prisma-event-client';

/**
 * PostgreSQL Outbox repository (US149 / ADR-013).
 * Envelope columns are write-once; only delivery metadata mutates.
 */
export class PrismaOutboxRepository implements OutboxRepository {
  constructor(private readonly prisma: PrismaOutboxClient) {}

  async insert(envelope: DurableEventEnvelope, createdAt: string): Promise<OutboxRecord> {
    const row = await this.prisma.outboxEvent.create({
      data: {
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
      },
    });
    return toRecord(row);
  }

  async findByEventId(eventId: string): Promise<OutboxRecord | null> {
    const row = await this.prisma.outboxEvent.findUnique({ where: { eventId: String(eventId) } });
    return row ? toRecord(row) : null;
  }

  async listUnpublished(query: UnpublishedOutboxQuery = {}): Promise<OutboxRecord[]> {
    const readyAt = query.readyAt !== undefined ? new Date(query.readyAt) : undefined;
    const rows = await this.prisma.outboxEvent.findMany({
      where: {
        status: { in: ['pending', 'publishing'] },
        ...(query.workspaceId !== undefined ? { workspaceId: query.workspaceId } : {}),
        ...(readyAt !== undefined
          ? {
              OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: readyAt } }],
            }
          : {}),
      },
      orderBy: [
        { aggregateType: 'asc' },
        { aggregateId: 'asc' },
        { aggregateVersion: 'asc' },
        { createdAt: 'asc' },
      ],
      ...(query.limit !== undefined ? { take: query.limit } : {}),
    });
    return rows.map(toRecord);
  }

  async updateDelivery(eventId: string, patch: OutboxDeliveryPatch): Promise<OutboxRecord> {
    const row = await this.prisma.outboxEvent.update({
      where: { eventId: String(eventId) },
      data: {
        ...(patch.status !== undefined ? { status: toPrismaStatus(patch.status) } : {}),
        ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
        ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
        ...(patch.nextAttemptAt !== undefined
          ? {
              nextAttemptAt: patch.nextAttemptAt === null ? null : new Date(patch.nextAttemptAt),
            }
          : {}),
        ...(patch.publishedAt !== undefined
          ? {
              publishedAt: patch.publishedAt === null ? null : new Date(patch.publishedAt),
            }
          : {}),
        updatedAt: new Date(patch.updatedAt),
      },
    });
    return toRecord(row);
  }

  async listByStatus(status: OutboxStatus): Promise<OutboxRecord[]> {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { status: toPrismaStatus(status) },
      orderBy: [
        { aggregateType: 'asc' },
        { aggregateId: 'asc' },
        { aggregateVersion: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    return rows.map(toRecord);
  }
}

type OutboxRow = {
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
  status: OutboxDeliveryStatus;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPrismaStatus(status: OutboxStatus): OutboxDeliveryStatus {
  return status as OutboxDeliveryStatus;
}

function toDomainStatus(status: OutboxDeliveryStatus): OutboxStatus {
  return status as OutboxStatus;
}

function toRecord(row: OutboxRow): OutboxRecord {
  const payload =
    row.payload !== null && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  const envelope: DurableEventEnvelope = Object.freeze({
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
  });
  return {
    envelope,
    status: toDomainStatus(row.status),
    attempts: row.attempts,
    lastError: row.lastError,
    nextAttemptAt: row.nextAttemptAt !== null ? row.nextAttemptAt.toISOString() : null,
    publishedAt: row.publishedAt !== null ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
