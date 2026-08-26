import type { MarketDataProviderCapability } from './market-data-provider-capabilities';

/**
 * W2-S03-a Market Data provider catalog.
 *
 * Data-driven and extensible: additional providers are catalog rows, not
 * edits to existing adapters. This catalog does not receive market data,
 * talk to a venue, or choose a transport.
 */
export const MARKET_DATA_PROVIDER_AVAILABILITY = ['AVAILABLE', 'UNAVAILABLE'] as const;
export type MarketDataProviderAvailability = (typeof MARKET_DATA_PROVIDER_AVAILABILITY)[number];

export type MarketDataProviderId = string;

export type MarketDataProviderMetadata = {
  readonly id: MarketDataProviderId;
  readonly displayName: string;
  readonly capabilities: readonly MarketDataProviderCapability[];
  readonly availability: MarketDataProviderAvailability;
};

const OFFERED_MARKET_DATA_CAPABILITIES = [
  'SYMBOLS',
  'TICKER',
  'CANDLES',
  'ORDER_BOOK',
] as const satisfies readonly MarketDataProviderCapability[];

export const MARKET_DATA_PROVIDER_CATALOG = [
  {
    id: 'BINANCE',
    displayName: 'Binance',
    capabilities: OFFERED_MARKET_DATA_CAPABILITIES,
    availability: 'AVAILABLE',
  },
  {
    id: 'BYBIT',
    displayName: 'Bybit',
    capabilities: OFFERED_MARKET_DATA_CAPABILITIES,
    availability: 'AVAILABLE',
  },
  {
    id: 'OKX',
    displayName: 'OKX',
    capabilities: OFFERED_MARKET_DATA_CAPABILITIES,
    availability: 'AVAILABLE',
  },
] as const satisfies readonly MarketDataProviderMetadata[];

export type OfferedMarketDataProviderId = (typeof MARKET_DATA_PROVIDER_CATALOG)[number]['id'];

export function listMarketDataProviders(): readonly MarketDataProviderMetadata[] {
  return MARKET_DATA_PROVIDER_CATALOG;
}

export function freezeMarketDataProvider(
  provider: MarketDataProviderMetadata,
): MarketDataProviderMetadata {
  return Object.freeze({
    id: provider.id,
    displayName: provider.displayName,
    capabilities: Object.freeze([...provider.capabilities]),
    availability: provider.availability,
  });
}
