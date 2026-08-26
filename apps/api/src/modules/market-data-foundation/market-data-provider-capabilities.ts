/**
 * W2-S03-a provider capability model.
 *
 * Capabilities are static adapter metadata. They declare what a provider may
 * later supply through the adapter contract. They are not projections, not
 * runtime detection, and they do not imply trading or a transport.
 */
export const MARKET_DATA_PROVIDER_CAPABILITIES = [
  'SYMBOLS',
  'TICKER',
  'CANDLES',
  'ORDER_BOOK',
] as const;

export type MarketDataProviderCapability = (typeof MARKET_DATA_PROVIDER_CAPABILITIES)[number];

const CAPABILITY_SET = new Set<string>(MARKET_DATA_PROVIDER_CAPABILITIES);

export function isMarketDataProviderCapability(
  value: string,
): value is MarketDataProviderCapability {
  return CAPABILITY_SET.has(value);
}

export function hasMarketDataProviderCapability(
  capabilities: readonly MarketDataProviderCapability[],
  capability: MarketDataProviderCapability,
): boolean {
  return capabilities.includes(capability);
}
