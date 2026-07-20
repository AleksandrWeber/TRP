/**
 * Supported exchange venue identifiers (US209).
 * Trading Core remains agnostic of these values beyond opaque routing keys.
 */
export const EXCHANGE_IDS = Object.freeze(['BINANCE', 'BYBIT', 'OKX', 'MOCK'] as const);

export type ExchangeId = (typeof EXCHANGE_IDS)[number];

export function isExchangeId(value: string): value is ExchangeId {
  return (EXCHANGE_IDS as readonly string[]).includes(value);
}

export function assertExchangeId(value: string): ExchangeId {
  if (!isExchangeId(value)) {
    throw new Error(`unsupported exchange id: ${value}`);
  }
  return value;
}
