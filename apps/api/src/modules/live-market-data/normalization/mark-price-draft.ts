import type { Instrument } from '../../market-data/instrument';
import type { MarketDataSourceId } from '../domain/market-data-source';

/**
 * Explicit mark-price source semantics (US136).
 * Distinct from last-trade / index / settlement unless mapped by an adapter.
 */
export enum MarkPriceSourceKind {
  /** Exchange-provided mark or mid used for valuation / paper fills. */
  EXCHANGE_MARK = 'exchange_mark',
  /** Best bid/ask mid derived inside a public-stream adapter. */
  BOOK_MID = 'book_mid',
}

/**
 * Provider-neutral mark-price draft (US136).
 * No Position / Portfolio / fill fields.
 */
export type MarkPriceDraft = Readonly<{
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  price: number;
  markSource: MarkPriceSourceKind;
  exchangeOccurredAt: string;
  receivedAt: string;
  processedAt: string;
  recordedAt: string;
  sequence: number;
}>;
