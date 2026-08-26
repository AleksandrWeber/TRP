import type {
  MarketOrderBookRetrievalAdapter,
  MarketOrderBookRetrievalAdapterRequest,
  MarketOrderBookRetrievalAdapterResult,
} from './market-order-book.retrieval';

/**
 * Planned provider order book retrieval. Bybit and OKX remain registered but
 * report not implemented in W2-S03-e.
 */
export class PlannedOrderBookRetrievalAdapter implements MarketOrderBookRetrievalAdapter {
  readonly implemented = false;

  constructor(readonly providerId: string) {}

  async retrieve(
    _request: MarketOrderBookRetrievalAdapterRequest,
  ): Promise<MarketOrderBookRetrievalAdapterResult> {
    return { kind: 'not_implemented' };
  }
}
