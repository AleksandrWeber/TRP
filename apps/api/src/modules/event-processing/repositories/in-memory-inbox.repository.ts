import { toConsumerId, type ConsumerId } from '../domain/consumer-id';
import { toDurableEventId, type DurableEventId } from '../domain/durable-event-id';
import type { InboxRecord } from '../domain/inbox-record';
import type { InboxRepository } from './inbox.repository';

/**
 * In-memory Inbox repository (US129).
 * Enforces unique (consumerId, eventId).
 */
export class InMemoryInboxRepository implements InboxRepository {
  private readonly byKey = new Map<string, InboxRecord>();

  async find(
    consumerId: ConsumerId | string,
    eventId: DurableEventId | string,
  ): Promise<InboxRecord | null> {
    return this.byKey.get(key(consumerId, eventId)) ?? null;
  }

  async insert(record: InboxRecord): Promise<InboxRecord> {
    const k = key(record.consumerId, record.eventId);
    if (this.byKey.has(k)) {
      throw new Error(`inbox record already exists: ${record.consumerId}+${record.eventId}`);
    }
    const frozen = Object.freeze({
      consumerId: toConsumerId(String(record.consumerId)),
      eventId: toDurableEventId(String(record.eventId)),
      consumerVersion: record.consumerVersion,
      processedAt: record.processedAt,
    });
    this.byKey.set(k, frozen);
    return frozen;
  }

  async remove(
    consumerId: ConsumerId | string,
    eventId: DurableEventId | string,
  ): Promise<boolean> {
    return this.byKey.delete(key(consumerId, eventId));
  }

  clear(): void {
    this.byKey.clear();
  }
}

function key(consumerId: ConsumerId | string, eventId: DurableEventId | string): string {
  return `${consumerId}::${eventId}`;
}
