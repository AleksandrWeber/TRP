import { describe, expect, it } from 'vitest';
import { projectExchangeSession } from './exchange-session.projection';

describe('Exchange session projection (W2-S02-c)', () => {
  it('projects session, health, reconnect, and availability for Exchange connections', () => {
    expect(projectExchangeSession('EXCHANGE', 'CONNECTED')).toEqual({
      state: 'CONNECTED',
      health: 'HEALTHY',
      reconnectRequired: false,
      reconnectAllowed: false,
      providerAvailability: 'AVAILABLE',
    });
    expect(projectExchangeSession('EXCHANGE', 'SESSION_EXPIRED')).toEqual({
      state: 'SESSION_EXPIRED',
      health: 'EXPIRED',
      reconnectRequired: true,
      reconnectAllowed: true,
      providerAvailability: 'UNKNOWN',
    });
    expect(projectExchangeSession('EXCHANGE', 'CONNECTION_LOST')).toEqual({
      state: 'CONNECTION_LOST',
      health: 'CONNECTION_LOST',
      reconnectRequired: true,
      reconnectAllowed: true,
      providerAvailability: 'UNKNOWN',
    });
    expect(projectExchangeSession('EXCHANGE', 'PROVIDER_UNAVAILABLE')).toEqual({
      state: 'PROVIDER_UNAVAILABLE',
      health: 'UNAVAILABLE',
      reconnectRequired: true,
      reconnectAllowed: true,
      providerAvailability: 'UNAVAILABLE',
    });
    expect(projectExchangeSession('EXCHANGE', 'HANDSHAKE_TIMEOUT')).toMatchObject({
      state: 'VALIDATION_FAILED',
      health: null,
      reconnectRequired: false,
      reconnectAllowed: true,
    });
  });

  it('does not project an exchange session onto notification or AI connections', () => {
    expect(projectExchangeSession('NOTIFICATION', 'CONNECTED')).toBeNull();
    expect(projectExchangeSession('AI', 'CONNECTED')).toBeNull();
  });
});
