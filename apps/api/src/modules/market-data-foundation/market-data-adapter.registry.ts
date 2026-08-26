import { DeclaredMarketDataAdapter, type MarketDataProviderAdapter } from './market-data-adapter';
import {
  MARKET_DATA_PROVIDER_CATALOG,
  type MarketDataProviderId,
} from './market-data-provider-catalog';

export class MarketDataProviderNotFoundError extends Error {
  constructor(providerId: string) {
    super(`Market Data provider not found: ${providerId}`);
    this.name = 'MarketDataProviderNotFoundError';
  }
}

export class MarketDataProviderAlreadyRegisteredError extends Error {
  constructor(providerId: string) {
    super(`Market Data provider already registered: ${providerId}`);
    this.name = 'MarketDataProviderAlreadyRegisteredError';
  }
}

export class MarketDataProviderIdentityInvalidError extends Error {
  constructor() {
    super('Market Data provider id must not be empty');
    this.name = 'MarketDataProviderIdentityInvalidError';
  }
}

/**
 * W2-S03-a provider registry.
 *
 * Registration, discovery, and lookup are adapter-driven. Unknown providers
 * fail closed. The registry never talks to a venue and never chooses a
 * transport.
 */
export class MarketDataAdapterRegistry {
  private readonly adapters = new Map<MarketDataProviderId, MarketDataProviderAdapter>();

  constructor(adapters: readonly MarketDataProviderAdapter[] = createOfferedMarketDataAdapters()) {
    for (const adapter of adapters) {
      this.register(adapter);
    }
  }

  register(adapter: MarketDataProviderAdapter): void {
    const id = adapter.identity.id.trim();
    if (id === '') {
      throw new MarketDataProviderIdentityInvalidError();
    }
    if (this.adapters.has(id)) {
      throw new MarketDataProviderAlreadyRegisteredError(id);
    }
    this.adapters.set(id, adapter);
  }

  list(): readonly MarketDataProviderAdapter[] {
    return Object.freeze([...this.adapters.values()]);
  }

  lookup(id: string): MarketDataProviderAdapter | null {
    return this.adapters.get(id) ?? null;
  }

  select(id: string): MarketDataProviderAdapter {
    const adapter = this.lookup(id);
    if (!adapter) {
      throw new MarketDataProviderNotFoundError(id);
    }
    return adapter;
  }
}

export const defaultMarketDataAdapterRegistry = new MarketDataAdapterRegistry();

export function lookupMarketDataAdapter(id: string): MarketDataProviderAdapter | null {
  return defaultMarketDataAdapterRegistry.lookup(id);
}

export function selectMarketDataAdapter(id: string): MarketDataProviderAdapter {
  return defaultMarketDataAdapterRegistry.select(id);
}

export function createOfferedMarketDataAdapters(): readonly MarketDataProviderAdapter[] {
  return MARKET_DATA_PROVIDER_CATALOG.map((metadata) => new DeclaredMarketDataAdapter(metadata));
}
