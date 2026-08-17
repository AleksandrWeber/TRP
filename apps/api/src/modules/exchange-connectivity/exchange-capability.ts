/**
 * Session-verified exchange capabilities (W2-S02-d).
 *
 * These identifiers are verified against an authenticated session. They are
 * not catalog metadata and they do not authorize trading, balances, orders,
 * positions, market data, or WebSockets.
 */
export const EXCHANGE_SESSION_CAPABILITIES = [
  'SPOT',
  'MARGIN',
  'FUTURES',
  'TESTNET',
  'REST',
  'WEBSOCKET',
  'WITHDRAW',
  'DEPOSIT',
] as const;

export type ExchangeSessionCapability = (typeof EXCHANGE_SESSION_CAPABILITIES)[number];

const CAPABILITY_SET = new Set<string>(EXCHANGE_SESSION_CAPABILITIES);

export function isExchangeSessionCapability(value: string): value is ExchangeSessionCapability {
  return CAPABILITY_SET.has(value);
}

/** Verified capabilities must not be used for business actions. */
export const CAPABILITY_USE_ENABLED = false;

export function canUseVerifiedCapability(): false {
  return CAPABILITY_USE_ENABLED;
}
