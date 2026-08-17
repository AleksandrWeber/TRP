/**
 * Provider adapter abstraction (W2-S02-b).
 *
 * Each adapter owns authenticated handshake, handshake error translation, and
 * provider-specific request format. Adapters do not own Vault, authorization,
 * workspace, or audit.
 */
export type ExchangeHandshakeAdapterKind =
  | 'authenticated'
  | 'authentication_failed'
  | 'provider_unavailable'
  | 'timeout'
  | 'not_implemented'
  | 'failed';

export type ExchangeHandshakeAdapterResult = Readonly<{
  kind: ExchangeHandshakeAdapterKind;
}>;

export type ExchangeHandshakeAdapterRequest = Readonly<{
  credentials: Readonly<Record<string, string>>;
  nowMs: number;
  signal: AbortSignal;
}>;

export interface ExchangeProviderAdapter {
  readonly providerId: string;
  readonly implemented: boolean;
  handshake(request: ExchangeHandshakeAdapterRequest): Promise<ExchangeHandshakeAdapterResult>;
}

export const EXCHANGE_PROVIDER_ADAPTERS = Symbol('EXCHANGE_PROVIDER_ADAPTERS');
