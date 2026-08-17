/**
 * W2-S02-b handshake outcomes.
 *
 * Connected means only that the exchange accepted authenticated communication.
 * It does not mean trading, balances, orders, market data, or WebSockets.
 */
export const EXCHANGE_HANDSHAKE_OUTCOMES = [
  'CONNECTED',
  'VALIDATION_FAILED',
  'HANDSHAKE_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'AUTHENTICATION_FAILED',
] as const;

export type ExchangeHandshakeOutcome = (typeof EXCHANGE_HANDSHAKE_OUTCOMES)[number];

export type ExchangeHandshakeResult = Readonly<{
  outcome: ExchangeHandshakeOutcome;
}>;

export const EXCHANGE_HANDSHAKE_FAILURE_OUTCOMES = [
  'VALIDATION_FAILED',
  'HANDSHAKE_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'AUTHENTICATION_FAILED',
] as const satisfies readonly ExchangeHandshakeOutcome[];

export function isExchangeHandshakeOutcome(value: string): value is ExchangeHandshakeOutcome {
  return (EXCHANGE_HANDSHAKE_OUTCOMES as readonly string[]).includes(value);
}

export function isConnectedHandshakeOutcome(
  outcome: ExchangeHandshakeOutcome,
): outcome is 'CONNECTED' {
  return outcome === 'CONNECTED';
}
