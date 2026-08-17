import { describe, expect, it } from 'vitest';
import { mapProviderCapabilities } from './exchange-capability.mapping';

const BINANCE_CATALOG = ['SPOT', 'FUTURES', 'TESTNET', 'MARGIN', 'WEBSOCKET', 'REST'] as const;

describe('Exchange capability mapper (W2-S02-d)', () => {
  it('maps Binance restriction evidence honestly', () => {
    const mapped = mapProviderCapabilities({
      catalogCapabilities: BINANCE_CATALOG,
      evidence: {
        restObserved: true,
        spot: true,
        margin: false,
        futures: true,
        withdraw: false,
      },
      outcome: 'completed',
    });

    expect(mapped).toEqual([
      { capability: 'SPOT', state: 'SUPPORTED' },
      { capability: 'MARGIN', state: 'UNAVAILABLE' },
      { capability: 'FUTURES', state: 'SUPPORTED' },
      { capability: 'TESTNET', state: 'UNKNOWN' },
      { capability: 'REST', state: 'SUPPORTED' },
      { capability: 'WEBSOCKET', state: 'UNKNOWN' },
      { capability: 'WITHDRAW', state: 'UNAVAILABLE' },
      { capability: 'DEPOSIT', state: 'UNKNOWN' },
    ]);
  });

  it('prefers unknown over guessing when evidence is missing', () => {
    const mapped = mapProviderCapabilities({
      catalogCapabilities: BINANCE_CATALOG,
      evidence: { restObserved: true },
      outcome: 'completed',
    });

    expect(mapped.find((item) => item.capability === 'SPOT')?.state).toBe('UNKNOWN');
    expect(mapped.find((item) => item.capability === 'WEBSOCKET')?.state).toBe('UNKNOWN');
    expect(mapped.find((item) => item.capability === 'TESTNET')?.state).toBe('UNKNOWN');
    expect(mapped.find((item) => item.capability === 'DEPOSIT')?.state).toBe('UNKNOWN');
    expect(mapped.find((item) => item.capability === 'REST')?.state).toBe('SUPPORTED');
    expect(mapped.map((item) => item.capability).join(',')).not.toMatch(
      /ORDERS|BALANCES|POSITIONS/,
    );
  });

  it('marks catalog-absent capabilities unsupported and verification failures without inventing supported', () => {
    const unsupported = mapProviderCapabilities({
      catalogCapabilities: ['SPOT', 'REST'],
      evidence: { restObserved: true },
      outcome: 'completed',
    });
    expect(unsupported.find((item) => item.capability === 'FUTURES')?.state).toBe('UNSUPPORTED');
    expect(unsupported.find((item) => item.capability === 'WITHDRAW')?.state).toBe('UNKNOWN');

    const failed = mapProviderCapabilities({
      catalogCapabilities: BINANCE_CATALOG,
      evidence: { restObserved: true },
      outcome: 'failed',
    });
    expect(failed.find((item) => item.capability === 'REST')?.state).toBe('SUPPORTED');
    expect(failed.find((item) => item.capability === 'SPOT')?.state).toBe('VERIFICATION_FAILED');
    expect(failed.find((item) => item.capability === 'FUTURES')?.state).toBe('VERIFICATION_FAILED');
    expect(failed.some((item) => item.state === 'SUPPORTED' && item.capability !== 'REST')).toBe(
      false,
    );
  });
});
