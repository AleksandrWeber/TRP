import type { DurableEventEnvelope } from './durable-event-envelope';

/**
 * Durable Outbox consumer registration (US130).
 * Successful return = durable acknowledgement (Inbox/checkpoint committed).
 * Thrown error keeps the Outbox row pending/retryable.
 */
export type DurableOutboxConsumer = {
  consumerId: string;
  handle(envelope: DurableEventEnvelope): Promise<void>;
};
