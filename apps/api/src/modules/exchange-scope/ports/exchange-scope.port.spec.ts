import { describe, expect, it } from 'vitest';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_PORTS_ACTIVE,
  EXCHANGE_SCOPE_QUERY_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
} from './exchange-scope.port';

describe('RC-27 Epic 3 — Exchange Scope ports posture', () => {
  it('exposes Symbol tokens with service / query / consumer-read active', () => {
    expect(typeof EXCHANGE_SCOPE_SERVICE_PORT).toBe('symbol');
    expect(typeof EXCHANGE_SCOPE_QUERY_PORT).toBe('symbol');
    expect(typeof EXCHANGE_SCOPE_CONSUMER_READ_PORT).toBe('symbol');
    expect(EXCHANGE_SCOPE_PORTS_ACTIVE).toEqual({
      exchangeScopeService: true,
      exchangeScopeQuery: true,
      consumerRead: true,
      persistence: false,
      rest: false,
      transport: false,
    });
  });

  it('does not export forbidden behavioural helpers on the ports module', async () => {
    const ports = await import('./exchange-scope.port');
    expect(ports).not.toHaveProperty('approveRisk');
    expect(ports).not.toHaveProperty('submitOrder');
    expect(ports).not.toHaveProperty('submitExecution');
    expect(ports).not.toHaveProperty('certifyStrategy');
    expect(ports).not.toHaveProperty('createTradingSession');
    expect(ports).not.toHaveProperty('cloneRiskEngine');
    expect(ports).not.toHaveProperty('callExchangeApi');
  });
});
