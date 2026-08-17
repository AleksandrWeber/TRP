import type {
  ExchangeCapabilityAdapter,
  ExchangeCapabilityAdapterRequest,
  ExchangeCapabilityAdapterResult,
} from './exchange-capability.adapter';

/**
 * Planned capability adapter. Bybit and OKX remain cataloged but capability
 * verification is not implemented until handshake exists for those providers.
 */
export class PlannedExchangeCapabilityAdapter implements ExchangeCapabilityAdapter {
  readonly implemented = false;

  constructor(readonly providerId: string) {}

  async verify(
    _request: ExchangeCapabilityAdapterRequest,
  ): Promise<ExchangeCapabilityAdapterResult> {
    return { kind: 'not_implemented' };
  }
}
