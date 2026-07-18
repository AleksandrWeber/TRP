import type { Instrument } from '../../market-data/instrument';
import type { Timeframe } from '../../market-data/timeframe';
import type { MarketDataSourceId } from '../domain/market-data-source';

/**
 * Provider-neutral closed-candle draft (US135).
 * Adapters map exchange payloads into this shape; Binance fields must not appear here.
 */
export type ClosedCandleDraft = Readonly<{
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  openTime: string;
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  exchangeOccurredAt: string;
  receivedAt: string;
  processedAt: string;
  recordedAt: string;
  sequence: number;
  /** Only closed candles may be published. */
  isClosed: boolean;
}>;
