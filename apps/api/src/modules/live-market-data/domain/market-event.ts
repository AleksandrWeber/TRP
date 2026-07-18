import type { ClosedCandleEvent } from './closed-candle-event';
import type { MarkPriceEvent } from './mark-price-event';
import type { MarketStatusEvent } from './market-status';

/**
 * Discriminated union of canonical live market events (US126).
 */
export type MarketEvent = ClosedCandleEvent | MarkPriceEvent | MarketStatusEvent;

export function isClosedCandleEvent(event: MarketEvent): event is ClosedCandleEvent {
  return event.eventType === 'MarketClosedCandle';
}

export function isMarkPriceEvent(event: MarketEvent): event is MarkPriceEvent {
  return event.eventType === 'MarketMarkPrice';
}

export function isMarketStatusEvent(event: MarketEvent): event is MarketStatusEvent {
  return event.eventType === 'MarketStatusChanged';
}
