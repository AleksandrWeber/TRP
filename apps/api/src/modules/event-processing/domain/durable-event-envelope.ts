import type { DurableEventId } from './durable-event-id';

/**
 * ADR-013 durable event envelope (US128).
 * Payload is immutable once persisted. Operational delivery fields live on OutboxRecord.
 */
export type DurableEventEnvelope = Readonly<{
  eventId: DurableEventId;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  /** Stream/aggregate sequence — monotonic within the aggregate stream. */
  aggregateVersion: number;
  workspaceId: string;
  occurredAt: string;
  recordedAt: string;
  correlationId?: string;
  causationId?: string;
  actorId?: string;
  payload: Readonly<Record<string, unknown>>;
}>;
