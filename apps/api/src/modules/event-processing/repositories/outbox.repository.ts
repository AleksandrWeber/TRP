import type { DurableEventEnvelope } from '../domain/durable-event-envelope';
import type { OutboxDeliveryPatch, OutboxRecord } from '../domain/outbox-record';
import type { OutboxStatus } from '../domain/outbox-status';
import type { DurableEventId } from '../domain/durable-event-id';

export type UnpublishedOutboxQuery = {
  workspaceId?: string;
  /** Inclusive lower bound for nextAttemptAt / pending readiness. */
  readyAt?: string;
  limit?: number;
};

/**
 * Outbox persistence port (US128).
 * Insert is append-only for envelope; only delivery metadata is mutable.
 */
export interface OutboxRepository {
  insert(envelope: DurableEventEnvelope, createdAt: string): Promise<OutboxRecord>;
  findByEventId(eventId: DurableEventId | string): Promise<OutboxRecord | null>;
  /**
   * Ordered unpublished retrieval: pending/publishing by aggregate stream then version.
   */
  listUnpublished(query?: UnpublishedOutboxQuery): Promise<OutboxRecord[]>;
  updateDelivery(
    eventId: DurableEventId | string,
    patch: OutboxDeliveryPatch,
  ): Promise<OutboxRecord>;
  listByStatus(status: OutboxStatus): Promise<OutboxRecord[]>;
}
