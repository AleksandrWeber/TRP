import { describe, expect, it } from 'vitest';
import { DeclaredMarketDataAdapter } from './market-data-adapter';
import { MARKET_DATA_PROVIDER_CATALOG } from './market-data-provider-catalog';

describe('Market Data provider identity (W2-S03-a)', () => {
  it('exposes a provider-independent identity on every offered adapter', () => {
    const identities = MARKET_DATA_PROVIDER_CATALOG.map(
      (metadata) => new DeclaredMarketDataAdapter(metadata).identity,
    );

    expect(identities).toEqual([
      { id: 'BINANCE', displayName: 'Binance' },
      { id: 'BYBIT', displayName: 'Bybit' },
      { id: 'OKX', displayName: 'OKX' },
    ]);
    for (const identity of identities) {
      expect(Object.keys(identity).sort()).toEqual(['displayName', 'id']);
      expect(identity).not.toHaveProperty('transport');
      expect(identity).not.toHaveProperty('endpoint');
      expect(identity).not.toHaveProperty('connectionId');
    }
  });

  it('describes the adapter through identity rather than a transport client', () => {
    const adapter = new DeclaredMarketDataAdapter(MARKET_DATA_PROVIDER_CATALOG[1]);

    expect(adapter.describe().identity).toEqual(adapter.identity);
    expect(adapter).not.toHaveProperty('getTicker');
    expect(adapter).not.toHaveProperty('subscribe');
    expect(adapter).not.toHaveProperty('fetch');
  });
});
