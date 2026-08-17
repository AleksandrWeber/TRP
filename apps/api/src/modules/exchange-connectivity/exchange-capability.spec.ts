import { describe, expect, it } from 'vitest';
import {
  EXCHANGE_SESSION_CAPABILITIES,
  canUseVerifiedCapability,
  isExchangeSessionCapability,
} from './exchange-capability';

describe('Exchange session capabilities (W2-S02-d)', () => {
  it('lists verified capabilities without trading or market-data actions', () => {
    expect(EXCHANGE_SESSION_CAPABILITIES).toEqual([
      'SPOT',
      'MARGIN',
      'FUTURES',
      'TESTNET',
      'REST',
      'WEBSOCKET',
      'WITHDRAW',
      'DEPOSIT',
    ]);
    expect(EXCHANGE_SESSION_CAPABILITIES).not.toContain('ORDERS');
    expect(EXCHANGE_SESSION_CAPABILITIES).not.toContain('BALANCES');
    expect(EXCHANGE_SESSION_CAPABILITIES).not.toContain('POSITIONS');
    expect(EXCHANGE_SESSION_CAPABILITIES).not.toContain('TRADING');
    expect(isExchangeSessionCapability('SPOT')).toBe(true);
    expect(isExchangeSessionCapability('WITHDRAW')).toBe(true);
    expect(isExchangeSessionCapability('ORDERS')).toBe(false);
    expect(canUseVerifiedCapability()).toBe(false);
  });
});
