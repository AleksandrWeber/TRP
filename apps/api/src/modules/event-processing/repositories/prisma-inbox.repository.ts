import type { PrismaClient } from '@prisma/client';
import { toConsumerId, type ConsumerId } from '../domain/consumer-id';
import { toDurableEventId, type DurableEventId } from '../domain/durable-event-id';
import type { InboxRecord } from '../domain/inbox-record';
import type { InboxRepository } from './inbox.repository';

/**
 * PostgreSQL Inbox repository (US149 / ADR-013).
 * Unique (consumerId, eventId) enforced by primary key.
 */
export class PrismaInboxRepository implements InboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(
    consumerId: ConsumerId | string,
    eventId: DurableEventId | string,
  ): Promise<InboxRecord | null> {
    const row = await this.prisma.inboxRecord.findUnique({
      where: {
        consumerId_eventId: {
          consumerId: String(consumerId),
          eventId: String(eventId),
        },
      },
    });
    return row ? toRecord(row) : null;
  }

  async insert(record: InboxRecord): Promise<InboxRecord> {
    const row = await this.prisma.inboxRecord.create({
      data: {
        consumerId: String(record.consumerId),
        eventId: String(record.eventId),
        consumerVersion: record.consumerVersion,
        processedAt: new Date(record.processedAt),
      },
    });
    return toRecord(row);
  }

  async remove(
    consumerId: ConsumerId | string,
    eventId: DurableEventId | string,
  ): Promise<boolean> {
    try {
      await this.prisma.inboxRecord.delete({
        where: {
          consumerId_eventId: {
            consumerId: String(consumerId),
            eventId: String(eventId),
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}

function toRecord(row: {
  consumerId: string;
  eventId: string;
  consumerVersion: string;
  processedAt: Date;
}): InboxRecord {
  return Object.freeze({
    consumerId: toConsumerId(row.consumerId),
    eventId: toDurableEventId(row.eventId),
    consumerVersion: row.consumerVersion,
    processedAt: row.processedAt.toISOString(),
  });
}
