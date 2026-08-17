import type { ExchangeProviderCapability } from './exchange-provider-capabilities';
import type {
  ExchangeProviderAvailability,
  ExchangeProviderCategory,
  ExchangeProviderId,
  ExchangeProviderMetadata,
} from './exchange-provider-catalog';

/**
 * Provider identity owned by the connectivity abstraction.
 * Identity is catalog metadata. It is not a network session.
 */
export type ExchangeProviderIdentity = {
  readonly id: ExchangeProviderId;
  readonly displayName: string;
  readonly category: ExchangeProviderCategory;
};

/**
 * Future connectivity contract.
 *
 * W2-S02-a owns the contract shape: provider identity, capability description,
 * and selection result. Handshake, HTTP, authentication, WebSockets, and
 * venue I/O are later slices and are intentionally absent here.
 */
export type ExchangeConnectivityContract = {
  readonly identity: ExchangeProviderIdentity;
  readonly capabilities: readonly ExchangeProviderCapability[];
  readonly availability: ExchangeProviderAvailability;
};

export function describeExchangeConnectivity(
  provider: ExchangeProviderMetadata,
): ExchangeConnectivityContract {
  return {
    identity: {
      id: provider.id,
      displayName: provider.displayName,
      category: provider.category,
    },
    capabilities: provider.capabilities,
    availability: provider.availability,
  };
}
