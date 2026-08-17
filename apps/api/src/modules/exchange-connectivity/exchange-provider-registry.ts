import {
  EXCHANGE_PROVIDER_CATALOG,
  type ExchangeProviderId,
  type ExchangeProviderMetadata,
} from './exchange-provider-catalog';

export class ExchangeProviderNotFoundError extends Error {
  constructor(providerId: string) {
    super(`Exchange provider not found: ${providerId}`);
    this.name = 'ExchangeProviderNotFoundError';
  }
}

/**
 * W2-S02-a provider registry.
 *
 * Lookup and selection are catalog-driven. Unknown providers fail closed.
 * The registry never talks to an exchange.
 */
export class ExchangeProviderRegistry {
  private readonly providers: ReadonlyMap<ExchangeProviderId, ExchangeProviderMetadata>;

  constructor(catalog: readonly ExchangeProviderMetadata[] = EXCHANGE_PROVIDER_CATALOG) {
    this.providers = new Map(catalog.map((provider) => [provider.id, freezeProvider(provider)]));
  }

  list(): readonly ExchangeProviderMetadata[] {
    return Object.freeze([...this.providers.values()]);
  }

  lookup(id: string): ExchangeProviderMetadata | null {
    return this.providers.get(id) ?? null;
  }

  select(id: string): ExchangeProviderMetadata {
    const provider = this.lookup(id);
    if (!provider) {
      throw new ExchangeProviderNotFoundError(id);
    }
    return provider;
  }
}

export const defaultExchangeProviderRegistry = new ExchangeProviderRegistry();

export function lookupExchangeProvider(id: string): ExchangeProviderMetadata | null {
  return defaultExchangeProviderRegistry.lookup(id);
}

export function selectExchangeProvider(id: string): ExchangeProviderMetadata {
  return defaultExchangeProviderRegistry.select(id);
}

function freezeProvider(provider: ExchangeProviderMetadata): ExchangeProviderMetadata {
  return Object.freeze({
    id: provider.id,
    displayName: provider.displayName,
    category: provider.category,
    capabilities: Object.freeze([...provider.capabilities]),
    availability: provider.availability,
  });
}
