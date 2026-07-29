import { FinancialDecimal } from '../../../financial';
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
 * Map Binance bookTicker → provider-neutral MarkPriceDraft using bid/ask mid (US136 / TD-039).
 * Midpoint is computed with exact decimal arithmetic; never via JavaScript Number.
 */
export function mapBinanceBookTickerToDraft(input: MapBinanceBookTickerInput): MarkPriceDraft {
  const symbol = String(input.message.s ?? '')
    .trim()
    .toUpperCase();
  if (symbol === '') {
    throw new Error('Binance bookTicker message is missing symbol');
  }

  const bidText = String(input.message.b ?? '').trim();
  const askText = String(input.message.a ?? '').trim();
  let bid: FinancialDecimal;
  let ask: FinancialDecimal;
  try {
    bid = FinancialDecimal.from(bidText).assertPositive('Binance bookTicker bid');
    ask = FinancialDecimal.from(askText).assertPositive('Binance bookTicker ask');
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Binance bookTicker bid/ask must be exact positive decimal text: ${error.message}`
        : 'Binance bookTicker bid/ask must be exact positive decimal text',
    );
  }
  if (ask.compare(bid) < 0) {
    throw new Error('Binance bookTicker ask must be >= bid');
  }

  const price = bid.plus(ask).dividedBy('2').toString();
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
