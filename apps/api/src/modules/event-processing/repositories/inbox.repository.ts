import type { ConsumerId } from '../domain/consumer-id';
import type { DurableEventId } from '../domain/durable-event-id';
import type { InboxRecord } from '../domain/inbox-record';

export interface InboxRepository {
  find(
    consumerId: ConsumerId | string,
    eventId: DurableEventId | string,
  ): Promise<InboxRecord | null>;
  insert(record: InboxRecord): Promise<InboxRecord>;
  /** Test/rollback helper. */
  remove(consumerId: ConsumerId | string, eventId: DurableEventId | string): Promise<boolean>;
}
