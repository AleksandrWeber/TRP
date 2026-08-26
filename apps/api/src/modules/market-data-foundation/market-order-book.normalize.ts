import { calculateOrderBookFreshness } from './market-order-book.freshness';
import type {
  MarketOrderBookDepth,
  NormalizedMarketOrderBook,
  NormalizedOrderBookLevel,
  ProviderOrderBookLevel,
  ProviderOrderBookSnapshot,
} from './market-order-book';
import { isMarketOrderBookDepth } from './market-order-book';

const POSITIVE_DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

/** Allow small provider/local clock skew before rejecting exchange timestamps. */
export const MARKET_ORDER_BOOK_CLOCK_SKEW_MS = 30_000;

/**
 * Deterministic normalization of a provider order book snapshot.
 * Unknown fields are never guessed. Invalid values return null.
 */
export function normalizeProviderOrderBook(input: {
  providerId: string;
  normalizedSymbol: string;
  depthLimit: MarketOrderBookDepth;
  snapshot: ProviderOrderBookSnapshot;
  retrievalTimestamp: string;
}): NormalizedMarketOrderBook | null {
  const normalizedSymbol = input.normalizedSymbol.trim().toUpperCase();
  if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(normalizedSymbol)) {
    return null;
  }
  if (!isMarketOrderBookDepth(input.depthLimit)) {
    return null;
  }

  const bids = normalizeSide(input.snapshot.bids, 'bids');
  const asks = normalizeSide(input.snapshot.asks, 'asks');
  if (bids === null || asks === null) {
    return null;
  }
  if (bids.length > input.depthLimit || asks.length > input.depthLimit) {
    return null;
  }

  const retrievalMs = Date.parse(input.retrievalTimestamp);
  if (!Number.isFinite(retrievalMs)) {
    return null;
  }

  let exchangeTimestamp: string | null = null;
  if (input.snapshot.exchangeTimestampMs !== null) {
    const exchangeMs = input.snapshot.exchangeTimestampMs;
    if (!Number.isFinite(exchangeMs) || exchangeMs <= 0) {
      return null;
    }
    if (exchangeMs > retrievalMs + MARKET_ORDER_BOOK_CLOCK_SKEW_MS) {
      return null;
    }
    exchangeTimestamp = new Date(exchangeMs).toISOString();
  }

  const freshness = calculateOrderBookFreshness({
    exchangeTimestamp,
    retrievalTimestamp: input.retrievalTimestamp,
  });

  return Object.freeze({
    normalizedSymbol,
    depthLimit: input.depthLimit,
    bids: Object.freeze(bids),
    asks: Object.freeze(asks),
    exchangeTimestamp,
    retrievalTimestamp: input.retrievalTimestamp,
    providerId: input.providerId,
    freshness,
  });
}

function normalizeSide(
  levels: readonly ProviderOrderBookLevel[],
  side: 'bids' | 'asks',
): NormalizedOrderBookLevel[] | null {
  if (!Array.isArray(levels)) {
    return null;
  }
  const seen = new Set<string>();
  const normalized: NormalizedOrderBookLevel[] = [];
  for (const level of levels) {
    if (level === null || typeof level !== 'object') {
      return null;
    }
    const price = normalizePositiveDecimal(level.price);
    const quantity = normalizePositiveDecimal(level.quantity);
    if (price === null || quantity === null) {
      return null;
    }
    if (seen.has(price)) {
      return null;
    }
    seen.add(price);
    normalized.push(Object.freeze({ price, quantity }));
  }

  normalized.sort((a, b) => {
    const left = Number(a.price);
    const right = Number(b.price);
    return side === 'bids' ? right - left : left - right;
  });
  return normalized;
}

function normalizePositiveDecimal(value: string): string | null {
  const trimmed = value.trim();
  if (!POSITIVE_DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }
  if (Number(trimmed) <= 0) {
    return null;
  }
  return trimmed;
}
