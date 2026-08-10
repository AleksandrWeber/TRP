import { describe, expect, it } from 'vitest';
import {
  MARKET_PROFILE_PORTS_ACTIVE,
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
} from './market-profile.port';

describe('RC-25 Epic 5 — Market Profile ports posture', () => {
  it('activates publish + query; keeps persistence/REST inactive', () => {
    expect(typeof MARKET_PROFILE_SERVICE_PORT).toBe('symbol');
    expect(typeof MARKET_PROFILE_QUERY_PORT).toBe('symbol');
    expect(MARKET_PROFILE_PORTS_ACTIVE).toEqual({
      marketProfileService: true,
      marketProfileQuery: true,
      observationalInputReads: true,
      consumerRead: true,
      persistence: false,
      rest: false,
    });
  });

  it('does not expose selection / scoring / Session helpers on the ports module', async () => {
    const ports = await import('./market-profile.port');
    expect(ports).not.toHaveProperty('selectStrategy');
    expect(ports).not.toHaveProperty('forceTrade');
    expect(ports).not.toHaveProperty('startSession');
    expect(ports).not.toHaveProperty('computeVolatility');
    expect(ports).not.toHaveProperty('detectTrend');
    expect(ports).not.toHaveProperty('scoreLiquidity');
  });
});
