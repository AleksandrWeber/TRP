import { describe, expect, it } from 'vitest';
import { describeMarketDataAdapter } from './market-data-adapter.contract';
import { listMarketDataProviders } from './market-data-provider-catalog';
import { selectMarketDataAdapter } from './market-data-adapter.registry';

describe('Market Data adapter contract (W2-S03-a)', () => {
  it('projects identity, capabilities, and static availability without transport', () => {
    const contract = describeMarketDataAdapter(listMarketDataProviders()[0]);

    expect(contract).toEqual({
      identity: {
        id: 'BINANCE',
        displayName: 'Binance',
      },
      capabilities: ['SYMBOLS', 'TICKER', 'CANDLES', 'ORDER_BOOK'],
      availability: 'AVAILABLE',
    });
    expect(contract).not.toHaveProperty('connect');
    expect(contract).not.toHaveProperty('fetch');
    expect(contract).not.toHaveProperty('request');
    expect(contract).not.toHaveProperty('subscribe');
    expect(contract).not.toHaveProperty('poll');
    expect(contract).not.toHaveProperty('websocket');
    expect(contract).not.toHaveProperty('rest');
    expect(contract).not.toHaveProperty('getTicker');
    expect(contract).not.toHaveProperty('getCandles');
    expect(contract).not.toHaveProperty('getOrderBook');
  });

  it('uses the same contract shape for every offered provider', () => {
    const contracts = ['BINANCE', 'BYBIT', 'OKX'].map((id) =>
      selectMarketDataAdapter(id).describe(),
    );

    expect(new Set(contracts.map((contract) => Object.keys(contract).sort().join(','))).size).toBe(
      1,
    );
    expect(contracts.map((contract) => contract.identity.id)).toEqual(['BINANCE', 'BYBIT', 'OKX']);
    expect(contracts.every((contract) => contract.availability === 'AVAILABLE')).toBe(true);
    expect(
      contracts.every(
        (contract) => contract.capabilities.join(',') === 'SYMBOLS,TICKER,CANDLES,ORDER_BOOK',
      ),
    ).toBe(true);
  });
});
