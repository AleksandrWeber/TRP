/**
 * W2-S02-a provider capability model.
 *
 * Capabilities are catalog metadata only. They are not detected at runtime
 * and they do not imply trading, balances, positions, or a live session.
 */
export const EXCHANGE_PROVIDER_CAPABILITIES = [
  'SPOT',
  'FUTURES',
  'TESTNET',
  'MARGIN',
  'WEBSOCKET',
  'REST',
] as const;

export type ExchangeProviderCapability = (typeof EXCHANGE_PROVIDER_CAPABILITIES)[number];

const CAPABILITY_SET = new Set<string>(EXCHANGE_PROVIDER_CAPABILITIES);

export function isExchangeProviderCapability(value: string): value is ExchangeProviderCapability {
  return CAPABILITY_SET.has(value);
}

export function hasExchangeProviderCapability(
  capabilities: readonly ExchangeProviderCapability[],
  capability: ExchangeProviderCapability,
): boolean {
  return capabilities.includes(capability);
}
