import { describe, expect, it } from 'vitest';
import {
  AI_ANALYTICS_PORT,
  AI_ANALYTICS_PORTS_ACTIVE,
  REPORTING_QUERY_CONSUMER,
} from './ai-analytics.port';

describe('RC-24 Epic 5 — AI Analytics ports posture', () => {
  it('activates narrative ports over Reporting consumer', () => {
    expect(typeof AI_ANALYTICS_PORT).toBe('symbol');
    expect(typeof REPORTING_QUERY_CONSUMER).toBe('symbol');
    expect(AI_ANALYTICS_PORTS_ACTIVE).toEqual({
      explain: true,
      summarize: true,
      identifyTrends: true,
      generateNarrative: true,
      persistence: false,
      rest: false,
    });
  });

  it('does not expose trading or SoT mutation helpers', async () => {
    const ports = await import('./ai-analytics.port');
    expect(ports).not.toHaveProperty('executeTrade');
    expect(ports).not.toHaveProperty('approveRisk');
    expect(ports).not.toHaveProperty('modifyReport');
    expect(ports).not.toHaveProperty('queryKnowledgeLake');
  });
});
