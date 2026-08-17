import type {
  ExchangeHandshakeAdapterRequest,
  ExchangeHandshakeAdapterResult,
  ExchangeProviderAdapter,
} from './exchange-provider-adapter';

/**
 * Planned provider adapter. Bybit and OKX remain cataloged but handshake is
 * not implemented in W2-S02-b.
 */
export class PlannedExchangeHandshakeAdapter implements ExchangeProviderAdapter {
  readonly implemented = false;

  constructor(readonly providerId: string) {}

  async handshake(
    _request: ExchangeHandshakeAdapterRequest,
  ): Promise<ExchangeHandshakeAdapterResult> {
    return { kind: 'not_implemented' };
  }
}
