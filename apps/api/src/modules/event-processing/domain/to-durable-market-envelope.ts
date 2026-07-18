import type { MarketEvent } from '../../live-market-data/domain/market-event';
import { toDurableEventId } from './durable-event-id';
import type { DurableEventEnvelope } from './durable-event-envelope';

/**
 * Map a canonical MarketEvent into an ADR-013 durable envelope (US128).
 */
export function toDurableMarketEnvelope(event: MarketEvent): DurableEventEnvelope {
  const {
    eventId,
    eventType,
    schemaVersion,
    workspaceId,
    streamId,
    sequence,
    occurredAt,
    recordedAt,
    ...payload
  } = event;

  return Object.freeze({
    eventId: toDurableEventId(String(eventId)),
    eventType: String(eventType),
    schemaVersion,
    aggregateType: 'MarketStream',
    aggregateId: String(streamId),
    aggregateVersion: sequence,
    workspaceId,
    occurredAt,
    recordedAt,
    payload: Object.freeze({ ...payload }),
  });
}
