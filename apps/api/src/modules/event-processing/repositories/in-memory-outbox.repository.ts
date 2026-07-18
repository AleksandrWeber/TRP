import type { DurableEventEnvelope } from '../domain/durable-event-envelope';
import type { DurableEventId } from '../domain/durable-event-id';
import type { OutboxDeliveryPatch, OutboxRecord } from '../domain/outbox-record';
import { OutboxStatus } from '../domain/outbox-status';
import type { OutboxRepository, UnpublishedOutboxQuery } from './outbox.repository';

/**
 * In-memory OutboxRepository (US128).
 * Envelope stored by clone+freeze; delivery metadata is mutable.
 */
export class InMemoryOutboxRepository implements OutboxRepository {
  private readonly byEventId = new Map<string, OutboxRecord>();

  async insert(envelope: DurableEventEnvelope, createdAt: string): Promise<OutboxRecord> {
    if (this.byEventId.has(envelope.eventId)) {
      throw new Error(`outbox event already exists: ${envelope.eventId}`);
    }

    const record: OutboxRecord = {
      envelope: freezeEnvelope(envelope),
      status: OutboxStatus.PENDING,
      attempts: 0,
      lastError: null,
      nextAttemptAt: null,
      publishedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    this.byEventId.set(envelope.eventId, record);
    return cloneRecord(record);
  }

  async findByEventId(eventId: DurableEventId | string): Promise<OutboxRecord | null> {
    const found = this.byEventId.get(String(eventId));
    return found ? cloneRecord(found) : null;
  }

  async listUnpublished(query: UnpublishedOutboxQuery = {}): Promise<OutboxRecord[]> {
    const readyAt = query.readyAt;
    const limit = query.limit ?? Number.POSITIVE_INFINITY;

    const rows = Array.from(this.byEventId.values())
      .filter((row) => {
        if (row.status !== OutboxStatus.PENDING && row.status !== OutboxStatus.PUBLISHING) {
          return false;
        }
        if (query.workspaceId !== undefined && row.envelope.workspaceId !== query.workspaceId) {
          return false;
        }
        if (readyAt !== undefined && row.nextAttemptAt !== null && row.nextAttemptAt > readyAt) {
          return false;
        }
        return true;
      })
      .sort((a, b) => compareUnpublished(a, b))
      .slice(0, Number.isFinite(limit) ? limit : undefined)
      .map(cloneRecord);

    return rows;
  }

  async updateDelivery(
    eventId: DurableEventId | string,
    patch: OutboxDeliveryPatch,
  ): Promise<OutboxRecord> {
    const existing = this.byEventId.get(String(eventId));
    if (!existing) {
      throw new Error(`outbox event not found: ${eventId}`);
    }

    if (patch.status !== undefined) existing.status = patch.status;
    if (patch.attempts !== undefined) existing.attempts = patch.attempts;
    if (patch.lastError !== undefined) existing.lastError = patch.lastError;
    if (patch.nextAttemptAt !== undefined) existing.nextAttemptAt = patch.nextAttemptAt;
    if (patch.publishedAt !== undefined) existing.publishedAt = patch.publishedAt;
    existing.updatedAt = patch.updatedAt;

    return cloneRecord(existing);
  }

  async listByStatus(status: OutboxStatus): Promise<OutboxRecord[]> {
    return Array.from(this.byEventId.values())
      .filter((row) => row.status === status)
      .sort((a, b) => compareUnpublished(a, b))
      .map(cloneRecord);
  }

  /** Test / rollback helper — removes a row if present. */
  async remove(eventId: DurableEventId | string): Promise<boolean> {
    return this.byEventId.delete(String(eventId));
  }

  /** Test helper — clear all rows. */
  clear(): void {
    this.byEventId.clear();
  }
}

function compareUnpublished(a: OutboxRecord, b: OutboxRecord): number {
  const streamCmp = `${a.envelope.aggregateType}:${a.envelope.aggregateId}`.localeCompare(
    `${b.envelope.aggregateType}:${b.envelope.aggregateId}`,
  );
  if (streamCmp !== 0) return streamCmp;
  if (a.envelope.aggregateVersion !== b.envelope.aggregateVersion) {
    return a.envelope.aggregateVersion - b.envelope.aggregateVersion;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

function freezeEnvelope(envelope: DurableEventEnvelope): DurableEventEnvelope {
  return Object.freeze({
    ...envelope,
    payload: Object.freeze({ ...envelope.payload }),
  });
}

function cloneRecord(record: OutboxRecord): OutboxRecord {
  return {
    envelope: record.envelope,
    status: record.status,
    attempts: record.attempts,
    lastError: record.lastError,
    nextAttemptAt: record.nextAttemptAt,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
