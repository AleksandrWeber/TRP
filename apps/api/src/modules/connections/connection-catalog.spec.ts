import { describe, expect, it } from 'vitest';
import { connectionCatalog, providerType } from './connection-catalog';

const EXCHANGE_CAPABILITIES = [
  'SPOT',
  'FUTURES',
  'TESTNET',
  'MARGIN',
  'WEBSOCKET',
  'REST',
] as const;

describe('Connection catalog (W2-S01-a)', () => {
  it('offers only the approved provider families and providers', () => {
    expect(connectionCatalog()).toEqual({
      connectionTypes: [
        {
          id: 'EXCHANGE',
          displayName: 'Exchange',
          providers: [
            {
              id: 'BINANCE',
              displayName: 'Binance',
              credentialFields: ['apiKey', 'apiSecret'],
              capabilities: EXCHANGE_CAPABILITIES,
              availability: 'AVAILABLE',
              category: 'EXCHANGE',
            },
            {
              id: 'BYBIT',
              displayName: 'Bybit',
              credentialFields: ['apiKey', 'apiSecret'],
              capabilities: EXCHANGE_CAPABILITIES,
              availability: 'AVAILABLE',
              category: 'EXCHANGE',
            },
            {
              id: 'OKX',
              displayName: 'OKX',
              credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
              capabilities: EXCHANGE_CAPABILITIES,
              availability: 'AVAILABLE',
              category: 'EXCHANGE',
            },
          ],
        },
        {
          id: 'NOTIFICATION',
          displayName: 'Notification',
          providers: [
            { id: 'TELEGRAM', displayName: 'Telegram', credentialFields: ['botToken'] },
            {
              id: 'SMTP',
              displayName: 'SMTP',
              credentialFields: ['host', 'port', 'username', 'password', 'sender'],
            },
          ],
        },
        {
          id: 'AI',
          displayName: 'AI',
          providers: [
            { id: 'OPENROUTER', displayName: 'OpenRouter', credentialFields: ['apiKey'] },
          ],
        },
      ],
      exchangeProviders: [
        {
          id: 'BINANCE',
          displayName: 'Binance',
          category: 'EXCHANGE',
          capabilities: EXCHANGE_CAPABILITIES,
          availability: 'AVAILABLE',
        },
        {
          id: 'BYBIT',
          displayName: 'Bybit',
          category: 'EXCHANGE',
          capabilities: EXCHANGE_CAPABILITIES,
          availability: 'AVAILABLE',
        },
        {
          id: 'OKX',
          displayName: 'OKX',
          category: 'EXCHANGE',
          capabilities: EXCHANGE_CAPABILITIES,
          availability: 'AVAILABLE',
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
