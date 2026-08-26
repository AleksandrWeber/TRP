import { describe, expect, it } from 'vitest';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_PORTS_ACTIVE,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
} from './market-qualification.port';

describe('RC-25 Epic 4 — Market Qualification ports posture', () => {
  it('activates lifecycle service + query; keeps persistence/REST inactive', () => {
    expect(typeof MARKET_QUALIFICATION_SERVICE_PORT).toBe('symbol');
    expect(typeof MARKET_QUALIFICATION_QUERY_PORT).toBe('symbol');
    expect(typeof LIVE_MARKET_DATA_READ_CONSUMER).toBe('symbol');
    expect(typeof RESEARCH_OUTPUT_READ_CONSUMER).toBe('symbol');
    expect(MARKET_QUALIFICATION_PORTS_ACTIVE).toEqual({
      marketQualificationService: true,
      marketQualificationQuery: true,
      liveMarketDataConsumer: true,
      researchOutputConsumer: true,
      consumerRead: true,
      persistence: true,
      rest: false,
    });
  });

  it('does not expose selection / execution / Session helpers on the ports module', async () => {
    const ports = await import('./market-qualification.port');
    expect(ports).not.toHaveProperty('selectStrategy');
    expect(ports).not.toHaveProperty('selectTactic');
    expect(ports).not.toHaveProperty('startSession');
    expect(ports).not.toHaveProperty('approveRisk');
    expect(ports).not.toHaveProperty('submitOrder');
    expect(ports).not.toHaveProperty('forceTrade');
    expect(ports).not.toHaveProperty('scoreConfidence');
    expect(ports).not.toHaveProperty('publishProfile');
  });
});
