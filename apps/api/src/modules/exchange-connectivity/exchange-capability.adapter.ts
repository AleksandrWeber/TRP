/**
 * Provider capability-verification adapter (W2-S02-d).
 *
 * Adapters collect restriction evidence after handshake. They do not place
 * orders, read balances, open positions, consume market data, or open WebSockets.
 */

export type ExchangeCapabilityAdapterKind =
  'verified' | 'provider_unavailable' | 'failed' | 'not_implemented';

export type ExchangeCapabilityAdapterRequest = Readonly<{
  credentials: Readonly<Record<string, string>>;
  nowMs: number;
  signal: AbortSignal;
}>;

export type ExchangeCapabilityAdapterEvidence = Readonly<{
  spot?: boolean;
  margin?: boolean;
  futures?: boolean;
  testnet?: boolean;
  websocket?: boolean;
  withdraw?: boolean;
  deposit?: boolean;
}>;

export type ExchangeCapabilityAdapterResult = Readonly<{
  kind: ExchangeCapabilityAdapterKind;
  evidence?: ExchangeCapabilityAdapterEvidence;
}>;

export interface ExchangeCapabilityAdapter {
  readonly providerId: string;
  readonly implemented: boolean;
  verify(request: ExchangeCapabilityAdapterRequest): Promise<ExchangeCapabilityAdapterResult>;
}

export const EXCHANGE_CAPABILITY_ADAPTERS = Symbol('EXCHANGE_CAPABILITY_ADAPTERS');
