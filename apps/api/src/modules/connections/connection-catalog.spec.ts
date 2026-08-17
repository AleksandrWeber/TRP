import { describe, expect, it } from 'vitest';
import { connectionCatalog, providerType } from './connection-catalog';

describe('Connection catalog (W2-S01-a)', () => {
  it('offers only the approved provider families and providers', () => {
    expect(connectionCatalog()).toEqual({
      connectionTypes: [
        {
          id: 'EXCHANGE',
          displayName: 'Exchange',
          providers: [
            { id: 'BINANCE', displayName: 'Binance' },
            { id: 'BYBIT', displayName: 'Bybit' },
            { id: 'OKX', displayName: 'OKX' },
          ],
        },
        {
          id: 'NOTIFICATION',
          displayName: 'Notification',
          providers: [
            { id: 'TELEGRAM', displayName: 'Telegram' },
            { id: 'SMTP', displayName: 'SMTP' },
          ],
        },
        {
          id: 'AI',
          displayName: 'AI',
          providers: [{ id: 'OPENROUTER', displayName: 'OpenRouter' }],
        },
      ],
    });
  });

  it('maps offered providers to their metadata-only type', () => {
    expect(providerType('BINANCE')).toBe('EXCHANGE');
    expect(providerType('SMTP')).toBe('NOTIFICATION');
    expect(providerType('OPENROUTER')).toBe('AI');
    expect(providerType('COINBASE')).toBeNull();
  });
});
