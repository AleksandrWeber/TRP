import type { ProviderSymbolDefinition } from './market-symbol';

/**
 * Symbol discovery adapter contract (W2-S03-b).
 *
 * Transport is an implementation detail of each adapter. The Market Data
 * domain never names REST, streaming sockets, cache, or storage on this interface.
 */
export type MarketSymbolDiscoveryAdapterKind =
  'discovered' | 'provider_unavailable' | 'not_implemented' | 'malformed' | 'failed';

export type MarketSymbolDiscoveryAdapterRequest = Readonly<{
  nowMs: number;
  signal: AbortSignal;
}>;

export type MarketSymbolDiscoveryAdapterResult = Readonly<{
  kind: MarketSymbolDiscoveryAdapterKind;
  definitions?: readonly ProviderSymbolDefinition[];
}>;

export interface MarketSymbolDiscoveryAdapter {
  readonly providerId: string;
  readonly implemented: boolean;
  discover(
    request: MarketSymbolDiscoveryAdapterRequest,
  ): Promise<MarketSymbolDiscoveryAdapterResult>;
}

export const MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS = Symbol(
  'MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS',
);
