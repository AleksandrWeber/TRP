import type { ClosedCandleEvent } from './closed-candle-event';
import type { MarkPriceEvent } from './mark-price-event';
import type { MarketEvent } from './market-event';
import type { MarketStatusEvent } from './market-status';
import { toMarketEventId, type MarketEventId } from './market-event-id';
import { MarketEventType } from './market-event-type';

/**
 * Semantic deduplication identity (US127).
 * Same market fact → same identity, independent of UUID eventId and
 * operational timestamps (received/processed/recorded).
 */
export type MarketEventSemanticIdentity = string & {
  readonly __brand: 'MarketEventSemanticIdentity';
};

function toSemanticIdentity(value: string): MarketEventSemanticIdentity {
  return value as MarketEventSemanticIdentity;
}

export function buildClosedCandleSemanticIdentity(
  event: Pick<
    ClosedCandleEvent,
    | 'workspaceId'
    | 'sourceId'
    | 'instrument'
    | 'channel'
    | 'timeframe'
    | 'openTime'
    | 'closeTime'
    | 'open'
    | 'high'
    | 'low'
    | 'close'
    | 'volume'
    | 'exchangeOccurredAt'
  >,
): MarketEventSemanticIdentity {
  return toSemanticIdentity(
    [
      event.workspaceId,
      event.sourceId,
      event.instrument,
      event.channel,
      event.timeframe,
      event.openTime,
      event.closeTime,
      event.exchangeOccurredAt,
      String(event.open),
      String(event.high),
      String(event.low),
      String(event.close),
      String(event.volume),
    ].join('|'),
  );
}

export function buildMarkPriceSemanticIdentity(
  event: Pick<
    MarkPriceEvent,
    'workspaceId' | 'sourceId' | 'instrument' | 'channel' | 'exchangeOccurredAt' | 'price'
  >,
): MarketEventSemanticIdentity {
  return toSemanticIdentity(
    [
      event.workspaceId,
      event.sourceId,
      event.instrument,
      event.channel,
      event.exchangeOccurredAt,
      String(event.price),
    ].join('|'),
  );
}

export function buildMarketStatusSemanticIdentity(
  event: Pick<
    MarketStatusEvent,
    | 'workspaceId'
    | 'sourceId'
    | 'instrument'
    | 'channel'
    | 'streamId'
    | 'status'
    | 'exchangeOccurredAt'
    | 'reason'
  >,
): MarketEventSemanticIdentity {
  return toSemanticIdentity(
    [
      event.workspaceId,
      event.sourceId,
      event.instrument,
      event.channel,
      event.streamId,
      event.status,
      event.exchangeOccurredAt,
      event.reason ?? '',
    ].join('|'),
  );
}

export function buildMarketEventSemanticIdentity(event: MarketEvent): MarketEventSemanticIdentity {
  switch (event.eventType) {
    case MarketEventType.CLOSED_CANDLE:
      return buildClosedCandleSemanticIdentity(event);
    case MarketEventType.MARK_PRICE:
      return buildMarkPriceSemanticIdentity(event);
    case MarketEventType.STATUS_CHANGED:
      return buildMarketStatusSemanticIdentity(event);
  }
}

/**
 * Deterministic eventId derived from semantic identity (US127).
 * Callers may still supply an explicit eventId; equality of semantic
 * identity is authoritative for deduplication, not UUID alone.
 */
export function eventIdFromSemanticIdentity(
  semanticIdentity: MarketEventSemanticIdentity,
): MarketEventId {
  return toMarketEventId(`sem:${semanticIdentity}`);
}
