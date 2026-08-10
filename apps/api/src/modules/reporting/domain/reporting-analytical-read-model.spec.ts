import { describe, expect, it } from 'vitest';
import type { AnalyticalFact } from '../../knowledge-lake/domain/analytical-fact-admission';
import {
  REPORTING_READ_AUTHORITY_CLASS,
  toAnalyticalFactQuery,
  toReportingAnalyticalFact,
  toReportingAnalyticalFactPage,
} from './reporting-analytical-read-model';

const sampleFact: AnalyticalFact = Object.freeze({
  eventId: 'evt-1',
  occurredAt: '2026-08-10T10:00:00.000Z',
  admittedAt: '2026-08-10T10:00:01.000Z',
  producer: 'trading-session',
  category: 'Trading',
  mode: 'paper',
  workspaceId: 'ws-1',
  tradingSessionId: 'session-1',
  exchangeScopeId: 'scope-binance',
  correlationId: 'corr-a',
  payload: { kind: 'marker' },
  schemaVersion: '1',
});

describe('RC-24 Epic 2 — Reporting analytical read models', () => {
  it('maps Lake facts to immutable projection read models', () => {
    const read = toReportingAnalyticalFact(sampleFact);
    expect(read.authorityClass).toBe(REPORTING_READ_AUTHORITY_CLASS);
    expect(read.authorityClass).toBe('projection');
    expect(read.eventId).toBe('evt-1');
    expect(read.category).toBe('Trading');
    expect(read.producer).toBe('trading-session');
    expect(read.tradingSessionId).toBe('session-1');
    expect(read.exchangeScopeId).toBe('scope-binance');
    expect(read.correlationId).toBe('corr-a');
    expect(Object.isFrozen(read)).toBe(true);
  });

  it('maps empty Lake pages to empty Reporting pages', () => {
    const page = toReportingAnalyticalFactPage({
      authorityClass: 'projection',
      items: [],
      nextCursor: null,
    });
    expect(page.authorityClass).toBe('projection');
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
    expect(Object.isFrozen(page)).toBe(true);
  });

  it('passes allowed query filters through to Lake query shape', () => {
    expect(
      toAnalyticalFactQuery({
        workspaceId: 'ws-1',
        categories: ['Trading', 'Risk'],
        producers: ['orders'],
        mode: 'paper',
        tradingSessionId: 'session-1',
        exchangeScopeId: 'scope-binance',
        occurredFrom: '2026-08-10T00:00:00.000Z',
        occurredTo: '2026-08-11T00:00:00.000Z',
        correlationId: 'corr-a',
        limit: 10,
      }),
    ).toEqual({
      workspaceId: 'ws-1',
      categories: ['Trading', 'Risk'],
      producers: ['orders'],
      mode: 'paper',
      tradingSessionId: 'session-1',
      exchangeScopeId: 'scope-binance',
      occurredFrom: '2026-08-10T00:00:00.000Z',
      occurredTo: '2026-08-11T00:00:00.000Z',
      correlationId: 'corr-a',
      limit: 10,
      cursor: undefined,
    });
  });
});
