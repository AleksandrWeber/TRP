import type { ConsumerId } from './consumer-id';
import type { DurableEventId } from './durable-event-id';

/**
 * Inbox deduplication record (US129 / ADR-013).
 * Unique pair: consumerId + eventId.
 */
export type InboxRecord = Readonly<{
  consumerId: ConsumerId;
  eventId: DurableEventId;
  consumerVersion: string;
  processedAt: string;
}>;
