import type {
  MarketTickerRetrievalAdapter,
  MarketTickerRetrievalAdapterRequest,
  MarketTickerRetrievalAdapterResult,
} from './market-ticker.retrieval';

/**
 * Planned provider ticker retrieval. Bybit and OKX remain registered but
 * report not implemented in W2-S03-c.
 */
export class PlannedTickerRetrievalAdapter implements MarketTickerRetrievalAdapter {
  readonly implemented = false;

  constructor(readonly providerId: string) {}

  async retrieve(
    _request: MarketTickerRetrievalAdapterRequest,
  ): Promise<MarketTickerRetrievalAdapterResult> {
    return { kind: 'not_implemented' };
  }
}
