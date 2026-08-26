import {
  describeMarketDataAdapter,
  type MarketDataAdapterContract,
  type MarketDataProviderIdentity,
} from './market-data-adapter.contract';
import {
  freezeMarketDataProvider,
  type MarketDataProviderMetadata,
} from './market-data-provider-catalog';

/**
 * Provider adapter interface (W2-S03-a).
 *
 * This is the only entry point later Market Data slices may consume.
 * Implementations hide how observations are obtained. The interface does not
 * name a transport and does not retrieve ticker, candles, or order book.
 */
export interface MarketDataProviderAdapter {
  readonly identity: MarketDataProviderIdentity;
  describe(): MarketDataAdapterContract;
}

/**
 * Metadata-only adapter. Used for offered providers in this slice and for
 * simulated extra providers in tests. Later slices replace registrations with
 * receive-capable adapters without changing this interface.
 */
export class DeclaredMarketDataAdapter implements MarketDataProviderAdapter {
  readonly identity: MarketDataProviderIdentity;
  private readonly metadata: MarketDataProviderMetadata;

  constructor(metadata: MarketDataProviderMetadata) {
    this.metadata = freezeMarketDataProvider(metadata);
    this.identity = Object.freeze({
      id: this.metadata.id,
      displayName: this.metadata.displayName,
    });
  }

  describe(): MarketDataAdapterContract {
    return describeMarketDataAdapter(this.metadata);
  }
}
