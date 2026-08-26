import type { MarketDataProviderCapability } from './market-data-provider-capabilities';
import type {
  MarketDataProviderAvailability,
  MarketDataProviderId,
  MarketDataProviderMetadata,
} from './market-data-provider-catalog';

/**
 * Provider identity owned by the Market Data adapter abstraction.
 * Identity is catalog metadata. It is not a network session and it is not a
 * Connection Management record.
 */
export type MarketDataProviderIdentity = {
  readonly id: MarketDataProviderId;
  readonly displayName: string;
};

/**
 * Provider-independent Market Data contract.
 *
 * W2-S03-a owns this contract shape: provider identity, capability
 * declarations, and static availability. The Market Data product consumes
 * only this contract. Transport — snapshot, stream, cache, replay, or
 * historical storage — is an adapter implementation detail and is
 * intentionally absent here.
 *
 * Receive, normalize, and project methods belong to later slices. They must
 * implement adapters behind this contract. They must not add transport
 * vocabulary to this type.
 */
export type MarketDataAdapterContract = {
  readonly identity: MarketDataProviderIdentity;
  readonly capabilities: readonly MarketDataProviderCapability[];
  readonly availability: MarketDataProviderAvailability;
};

export function describeMarketDataAdapter(
  provider: MarketDataProviderMetadata,
): MarketDataAdapterContract {
  return {
    identity: {
      id: provider.id,
      displayName: provider.displayName,
    },
    capabilities: provider.capabilities,
    availability: provider.availability,
  };
}
