import type { NormalizedMarketTicker } from '../market-data-foundation/market-ticker';
import type { PaperOrder } from './paper-order';

export type PaperMatchResult =
  | Readonly<{ matched: true; executionPrice: string }>
  | Readonly<{ matched: false; reason: string }>;

/**
 * Paper Matching (W2-S04-c).
 * Uses a Market Data ticker snapshot only. No invented prices, interpolation, or liquidity invention.
 */
export function matchPaperOrder(
  order: PaperOrder,
  ticker: NormalizedMarketTicker | null,
): PaperMatchResult {
  if (!ticker) {
    return { matched: false, reason: 'Market Data ticker snapshot unavailable' };
  }
  if (ticker.freshness !== 'FRESH') {
    return {
      matched: false,
      reason: `Market Data ticker is ${ticker.freshness.toLowerCase()} — execution refused`,
    };
  }
  if (
    ticker.providerId.toUpperCase() !== order.exchange ||
    (ticker.normalizedSymbol.toUpperCase() !== order.symbol &&
      !symbolsCompatible(ticker.normalizedSymbol, order.symbol))
  ) {
    // Allow exchangeSymbol vs normalizedSymbol mismatch when caller already resolved symbol.
  }

  const last = asNumber(ticker.lastPrice);
  const bid = asNumber(ticker.bid);
  const ask = asNumber(ticker.ask);
  if (last === null || bid === null || ask === null) {
    return { matched: false, reason: 'Market Data ticker prices are incomplete' };
  }

  switch (order.orderType) {
    case 'MARKET':
      return {
        matched: true,
        executionPrice: formatPrice(order.side === 'BUY' ? ask : bid),
      };
    case 'LIMIT': {
      const limit = asNumber(order.limitPrice);
      if (limit === null) return { matched: false, reason: 'limit price is required' };
      if (order.side === 'BUY') {
        if (ask <= limit) return { matched: true, executionPrice: formatPrice(ask) };
        return { matched: false, reason: 'limit buy cannot match current ask' };
      }
      if (bid >= limit) return { matched: true, executionPrice: formatPrice(bid) };
      return { matched: false, reason: 'limit sell cannot match current bid' };
    }
    case 'STOP': {
      const stop = asNumber(order.stopPrice);
      if (stop === null) return { matched: false, reason: 'stop price is required' };
      if (order.side === 'BUY') {
        if (last < stop) return { matched: false, reason: 'stop buy trigger not reached' };
        return { matched: true, executionPrice: formatPrice(ask) };
      }
      if (last > stop) return { matched: false, reason: 'stop sell trigger not reached' };
      return { matched: true, executionPrice: formatPrice(bid) };
    }
    case 'STOP_LIMIT': {
      const stop = asNumber(order.stopPrice);
      const limit = asNumber(order.limitPrice);
      if (stop === null || limit === null) {
        return { matched: false, reason: 'stop limit requires stop and limit prices' };
      }
      if (order.side === 'BUY') {
        if (last < stop) return { matched: false, reason: 'stop limit buy trigger not reached' };
        if (ask > limit)
          return { matched: false, reason: 'stop limit buy cannot match current ask' };
        return { matched: true, executionPrice: formatPrice(ask) };
      }
      if (last > stop) return { matched: false, reason: 'stop limit sell trigger not reached' };
      if (bid < limit)
        return { matched: false, reason: 'stop limit sell cannot match current bid' };
      return { matched: true, executionPrice: formatPrice(bid) };
    }
  }
}

function symbolsCompatible(a: string, b: string): boolean {
  return a.replace(/-/g, '').toUpperCase() === b.replace(/-/g, '').toUpperCase();
}

function asNumber(value: string | null): number | null {
  if (value === null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function formatPrice(value: number): string {
  const text = value.toFixed(8).replace(/\.?0+$/, '');
  return text.includes('.') ? text : `${text}`;
}
