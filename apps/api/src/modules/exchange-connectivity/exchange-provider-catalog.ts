import type { ExchangeProviderCapability } from './exchange-provider-capabilities';

/**
 * W2-S02-a Exchange Provider Catalog.
 *
 * Data-driven and extensible: additional providers are catalog rows, not
 * per-provider business logic. This catalog does not open connections,
 * authenticate, or send HTTP.
 */
export const EXCHANGE_PROVIDER_CATEGORIES = ['EXCHANGE'] as const;
export type ExchangeProviderCategory = (typeof EXCHANGE_PROVIDER_CATEGORIES)[number];

export const EXCHANGE_PROVIDER_AVAILABILITY = ['AVAILABLE', 'UNAVAILABLE'] as const;
export type ExchangeProviderAvailability = (typeof EXCHANGE_PROVIDER_AVAILABILITY)[number];

export type ExchangeProviderId = string;

export type ExchangeProviderMetadata = {
  readonly id: ExchangeProviderId;
  readonly displayName: string;
  readonly category: ExchangeProviderCategory;
  readonly capabilities: readonly ExchangeProviderCapability[];
  readonly availability: ExchangeProviderAvailability;
};

const OFFERED_EXCHANGE_CAPABILITIES = [
  'SPOT',
  'FUTURES',
  'TESTNET',
  'MARGIN',
  'WEBSOCKET',
  'REST',
] as const satisfies readonly ExchangeProviderCapability[];

export const EXCHANGE_PROVIDER_CATALOG = [
  {
    id: 'BINANCE',
    displayName: 'Binance',
    category: 'EXCHANGE',
    capabilities: OFFERED_EXCHANGE_CAPABILITIES,
    availability: 'AVAILABLE',
  },
  {
    id: 'BYBIT',
    displayName: 'Bybit',
    category: 'EXCHANGE',
    capabilities: OFFERED_EXCHANGE_CAPABILITIES,
    availability: 'AVAILABLE',
  },
  {
    id: 'OKX',
    displayName: 'OKX',
    category: 'EXCHANGE',
    capabilities: OFFERED_EXCHANGE_CAPABILITIES,
    availability: 'AVAILABLE',
  },
] as const satisfies readonly ExchangeProviderMetadata[];

export type OfferedExchangeProviderId = (typeof EXCHANGE_PROVIDER_CATALOG)[number]['id'];

export function listExchangeProviders(): readonly ExchangeProviderMetadata[] {
  return EXCHANGE_PROVIDER_CATALOG;
}
