import { DeclaredMarketDataAdapter, type MarketDataProviderAdapter } from './market-data-adapter';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import type { MarketDataProviderMetadata } from './market-data-provider-catalog';

/**
 * Adapter factory / resolver (W2-S03-a).
 *
 * Create constructs a metadata adapter from catalog identity. Resolve returns
 * the registered adapter for a provider. Additional providers are created and
 * registered without modifying existing adapters.
 *
 * Later slices implement adapters. They must not replace this factory with a
 * transport-specific client.
 */
export class MarketDataAdapterFactory {
  constructor(private readonly registry: MarketDataAdapterRegistry) {}

  create(metadata: MarketDataProviderMetadata): MarketDataProviderAdapter {
    return new DeclaredMarketDataAdapter(metadata);
  }

  resolve(providerId: string): MarketDataProviderAdapter {
    return this.registry.select(providerId);
  }

  tryResolve(providerId: string): MarketDataProviderAdapter | null {
    return this.registry.lookup(providerId);
  }

  discover(): readonly MarketDataProviderAdapter[] {
    return this.registry.list();
  }
}
