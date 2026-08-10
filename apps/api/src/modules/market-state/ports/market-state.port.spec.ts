import { describe, expect, it } from 'vitest';
import {
  MARKET_STATE_CONSUMER_READ_PORT,
  MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_STATE_PORTS_ACTIVE,
  MARKET_STATE_PROFILE_CONSUMER,
  MARKET_STATE_QUALIFICATION_CONSUMER,
  MARKET_STATE_QUERY_PORT,
  MARKET_STATE_SERVICE_PORT,
} from './market-state.port';

describe('RC-26 Epic 2/6 — Market State ports posture', () => {
  it('exposes Symbol tokens with input + consumer-read active; classify/query inactive', () => {
    expect(typeof MARKET_STATE_SERVICE_PORT).toBe('symbol');
    expect(typeof MARKET_STATE_QUERY_PORT).toBe('symbol');
    expect(typeof MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER).toBe('symbol');
    expect(typeof MARKET_STATE_QUALIFICATION_CONSUMER).toBe('symbol');
    expect(typeof MARKET_STATE_PROFILE_CONSUMER).toBe('symbol');
    expect(typeof MARKET_STATE_CONSUMER_READ_PORT).toBe('symbol');
    expect(MARKET_STATE_PORTS_ACTIVE).toEqual({
      marketStateService: false,
      marketStateQuery: false,
      liveMarketDataConsumer: true,
      qualificationConsumer: true,
      profileConsumer: true,
      consumerRead: true,
      persistence: false,
      rest: false,
    });
  });

  it('does not export forbidden behavioural helpers on the ports module', async () => {
    const ports = await import('./market-state.port');
    expect(ports).not.toHaveProperty('selectStrategy');
    expect(ports).not.toHaveProperty('classifyMarketStateImpl');
    expect(ports).not.toHaveProperty('runQualification');
    expect(ports).not.toHaveProperty('publishMarketProfile');
    expect(ports).not.toHaveProperty('approveRisk');
    expect(ports).not.toHaveProperty('submitOrder');
  });
});
