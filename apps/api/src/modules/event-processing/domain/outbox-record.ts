import type { DurableEventEnvelope } from './durable-event-envelope';
import type { OutboxStatus } from './outbox-status';

/**
 * Outbox record (US128).
 * `envelope` is immutable. Delivery metadata may change after insert.
 */
export type OutboxRecord = {
  readonly envelope: DurableEventEnvelope;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OutboxDeliveryPatch = {
  status?: OutboxStatus;
  attempts?: number;
  lastError?: string | null;
  nextAttemptAt?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
};
