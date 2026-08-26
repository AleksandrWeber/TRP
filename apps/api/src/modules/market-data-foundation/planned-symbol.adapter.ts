import type {
  MarketSymbolDiscoveryAdapter,
  MarketSymbolDiscoveryAdapterRequest,
  MarketSymbolDiscoveryAdapterResult,
} from './market-symbol.discovery';

/**
 * Planned provider symbol discovery. Bybit and OKX remain registered but
 * report not implemented in W2-S03-b.
 */
export class PlannedSymbolDiscoveryAdapter implements MarketSymbolDiscoveryAdapter {
  readonly implemented = false;

  constructor(readonly providerId: string) {}

  async discover(
    _request: MarketSymbolDiscoveryAdapterRequest,
  ): Promise<MarketSymbolDiscoveryAdapterResult> {
    return { kind: 'not_implemented' };
  }
}
