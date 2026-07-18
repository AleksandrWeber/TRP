import type { MarkPriceDraft, MarkPriceSourceKind } from '../../normalization/mark-price-draft';
import { MarkPriceSourceKind as Kind } from '../../normalization/mark-price-draft';
import { BINANCE_SPOT_SOURCE_ID } from './binance-spot.source';

/**
 * Internal Binance bookTicker payload (US136).
 * Adapter-local only — never exported from the public barrel.
 */
export type BinanceBookTickerMessage = {
  e?: string;
  u?: number;
  s?: string;
  b?: string;
  B?: string;
  a?: string;
  A?: string;
};

export type MapBinanceBookTickerInput = {
  workspaceId: string;
  sequence: number;
  message: BinanceBookTickerMessage;
  exchangeOccurredAt: string;
  receivedAt: string;
  processedAt: string;
  recordedAt: string;
};

/**
 * Map Binance bookTicker → provider-neutral MarkPriceDraft using bid/ask mid (US136).
 */
export function mapBinanceBookTickerToDraft(input: MapBinanceBookTickerInput): MarkPriceDraft {
  const symbol = String(input.message.s ?? '')
    .trim()
    .toUpperCase();
  if (symbol === '') {
    throw new Error('Binance bookTicker message is missing symbol');
  }
  const bid = Number(input.message.b);
  const ask = Number(input.message.a);
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) {
    throw new Error('Binance bookTicker bid/ask must be finite positive numbers');
  }
  if (ask < bid) {
    throw new Error('Binance bookTicker ask must be >= bid');
  }

  const price = (bid + ask) / 2;
  const markSource: MarkPriceSourceKind = Kind.BOOK_MID;

  return Object.freeze({
    workspaceId: input.workspaceId,
    sourceId: BINANCE_SPOT_SOURCE_ID,
    instrument: symbol,
    price,
    markSource,
    exchangeOccurredAt: input.exchangeOccurredAt,
    receivedAt: input.receivedAt,
    processedAt: input.processedAt,
    recordedAt: input.recordedAt,
    sequence: input.sequence,
  });
}
