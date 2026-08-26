import type {
  MarketCandleRetrievalAdapter,
  MarketCandleRetrievalAdapterRequest,
  MarketCandleRetrievalAdapterResult,
} from './market-candle.retrieval';

/**
 * Planned provider candlestick retrieval. Bybit and OKX remain registered but
 * report not implemented in W2-S03-d.
 */
export class PlannedCandleRetrievalAdapter implements MarketCandleRetrievalAdapter {
  readonly implemented = false;

  constructor(readonly providerId: string) {}

  async retrieve(
    _request: MarketCandleRetrievalAdapterRequest,
  ): Promise<MarketCandleRetrievalAdapterResult> {
    return { kind: 'not_implemented' };
  }
}
