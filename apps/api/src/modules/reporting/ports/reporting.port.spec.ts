import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_LAKE_QUERY_CONSUMER,
  REPORTING_PORTS_ACTIVE,
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
} from './reporting.port';

describe('RC-24 Epic 4 — Reporting ports posture', () => {
  it('activates Lake consumer + report service/query ports', () => {
    expect(typeof REPORTING_SERVICE_PORT).toBe('symbol');
    expect(typeof REPORTING_QUERY_PORT).toBe('symbol');
    expect(typeof KNOWLEDGE_LAKE_QUERY_CONSUMER).toBe('symbol');
    expect(REPORTING_PORTS_ACTIVE).toEqual({
      reportingService: true,
      reportingQuery: true,
      knowledgeLakeConsumer: true,
      historyReads: false,
      persistence: true,
      rest: false,
    });
  });

  it('does not expose AI narrative helpers on the ports module', async () => {
    const ports = await import('./reporting.port');
    expect(ports).not.toHaveProperty('generateNarrative');
    expect(ports).not.toHaveProperty('explain');
    expect(ports).not.toHaveProperty('identifyTrends');
  });
});
