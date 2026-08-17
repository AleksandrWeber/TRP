import { describe, expect, it } from 'vitest';
import { describeExchangeConnectivity } from './exchange-connectivity.contract';
import { selectExchangeProvider } from './exchange-provider-registry';

describe('Exchange connectivity contract (W2-S02-a)', () => {
  it('projects identity, capabilities, and availability without I/O methods', () => {
    const contract = describeExchangeConnectivity(selectExchangeProvider('BINANCE'));

    expect(contract).toEqual({
      identity: {
        id: 'BINANCE',
        displayName: 'Binance',
        category: 'EXCHANGE',
      },
      capabilities: ['SPOT', 'FUTURES', 'TESTNET', 'MARGIN', 'WEBSOCKET', 'REST'],
      availability: 'AVAILABLE',
    });
    expect(contract).not.toHaveProperty('connect');
    expect(contract).not.toHaveProperty('authenticate');
    expect(contract).not.toHaveProperty('handshake');
    expect(contract).not.toHaveProperty('request');
    expect(contract).not.toHaveProperty('subscribe');
  });

  it('uses the same contract shape for every offered provider', () => {
    const contracts = ['BINANCE', 'BYBIT', 'OKX'].map((id) =>
      describeExchangeConnectivity(selectExchangeProvider(id)),
    );

    expect(new Set(contracts.map((contract) => Object.keys(contract).sort().join(','))).size).toBe(
      1,
    );
    expect(contracts.every((contract) => contract.identity.category === 'EXCHANGE')).toBe(true);
    expect(contracts.every((contract) => contract.availability === 'AVAILABLE')).toBe(true);
  });
});
