import { describe, expect, it } from 'vitest';
import type { AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../ingestion/in-memory-knowledge-lake-ingestion.adapter';
import type { KnowledgeLakeQueryPort } from '../ports/knowledge-lake-query.port';

function admit(
  lake: InMemoryKnowledgeLakeIngestionAdapter,
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
): void {
  const result = lake.admit({
    occurredAt: '2026-08-10T12:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    payload: { kind: 'marker' },
    schemaVersion: '1',
    ...overrides,
  });
  expect(result.outcome).toBe('admitted');
}

function seedMixed(lake: InMemoryKnowledgeLakeIngestionAdapter): void {
  admit(lake, {
    eventId: 'evt-trade-1',
    occurredAt: '2026-08-10T10:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    tradingSessionId: 'session-1',
    correlationId: 'corr-a',
  });
  admit(lake, {
    eventId: 'evt-risk-1',
    occurredAt: '2026-08-10T11:00:00.000Z',
    producer: 'risk-engine',
    category: 'Risk',
    mode: 'paper',
    tradingSessionId: 'session-1',
    exchangeScopeId: 'scope-binance',
    correlationId: 'corr-a',
  });
  admit(lake, {
    eventId: 'evt-research-1',
    occurredAt: '2026-08-10T12:00:00.000Z',
    producer: 'research-lab',
    category: 'Research',
    mode: 'research',
    correlationId: 'corr-b',
  });
  admit(lake, {
    eventId: 'evt-other-ws',
    occurredAt: '2026-08-10T12:30:00.000Z',
    producer: 'orders',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-2',
    tradingSessionId: 'session-9',
  });
  admit(lake, {
    eventId: 'evt-trade-2',
    occurredAt: '2026-08-10T13:00:00.000Z',
    producer: 'orders',
    category: 'Trading',
    mode: 'paper',
    tradingSessionId: 'session-2',
    exchangeScopeId: 'scope-binance',
  });
}

describe('RC-21 Epic 5 — KnowledgeLakeQueryPort', () => {
  it('lists and gets analytical projections (authorityClass projection)', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    seedMixed(lake);
    const query: KnowledgeLakeQueryPort = lake;

    const page = query.list({ workspaceId: 'ws-1' });
    expect(page.authorityClass).toBe('projection');
    expect(page.items.map((f) => f.eventId)).toEqual([
      'evt-trade-1',
      'evt-risk-1',
      'evt-research-1',
      'evt-trade-2',
    ]);
    expect(page.nextCursor).toBeNull();

    const one = query.getByEventId('evt-risk-1');
    expect(one?.producer).toBe('risk-engine');
    expect(one?.category).toBe('Risk');
    expect(query.getByEventId('missing')).toBeNull();
  });

  it('filters by category, producer, mode, session, scope, correlation, time', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    seedMixed(lake);
    const query: KnowledgeLakeQueryPort = lake;

    expect(
      query.list({ workspaceId: 'ws-1', categories: ['Research'] }).items.map((f) => f.eventId),
    ).toEqual(['evt-research-1']);

    expect(
      query.list({ workspaceId: 'ws-1', producers: ['risk-engine'] }).items.map((f) => f.eventId),
    ).toEqual(['evt-risk-1']);

    expect(
      query.list({ workspaceId: 'ws-1', mode: 'research' }).items.map((f) => f.eventId),
    ).toEqual(['evt-research-1']);

    expect(
      query
        .list({ workspaceId: 'ws-1', tradingSessionId: 'session-1' })
        .items.map((f) => f.eventId),
    ).toEqual(['evt-trade-1', 'evt-risk-1']);

    expect(
      query
        .list({ workspaceId: 'ws-1', exchangeScopeId: 'scope-binance' })
        .items.map((f) => f.eventId),
    ).toEqual(['evt-risk-1', 'evt-trade-2']);

    expect(
      query.list({ workspaceId: 'ws-1', correlationId: 'corr-a' }).items.map((f) => f.eventId),
    ).toEqual(['evt-trade-1', 'evt-risk-1']);

    // occurredFrom inclusive, occurredTo exclusive
    expect(
      query
        .list({
          workspaceId: 'ws-1',
          occurredFrom: '2026-08-10T11:00:00.000Z',
          occurredTo: '2026-08-10T13:00:00.000Z',
        })
        .items.map((f) => f.eventId),
    ).toEqual(['evt-risk-1', 'evt-research-1']);
  });

  it('isolates workspaces (tenancy)', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    seedMixed(lake);
    const query: KnowledgeLakeQueryPort = lake;

    expect(query.list({ workspaceId: 'ws-2' }).items.map((f) => f.eventId)).toEqual([
      'evt-other-ws',
    ]);
    expect(
      query.list({ workspaceId: 'ws-1', producers: ['orders'] }).items.map((f) => f.eventId),
    ).toEqual(['evt-trade-2']);
  });

  it('isolates categories and producers (no cross-leak)', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    seedMixed(lake);
    const query: KnowledgeLakeQueryPort = lake;

    const research = query.list({
      workspaceId: 'ws-1',
      categories: ['Research'],
    });
    expect(research.items.every((f) => f.category === 'Research')).toBe(true);
    expect(research.items.some((f) => f.category === 'Trading')).toBe(false);

    const lab = query.list({
      workspaceId: 'ws-1',
      producers: ['research-lab'],
    });
    expect(lab.items.every((f) => f.producer === 'research-lab')).toBe(true);
    expect(lab.items.some((f) => f.producer === 'orders')).toBe(false);
  });

  it('paginates with limit/cursor and returns empty results safely', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    seedMixed(lake);
    const query: KnowledgeLakeQueryPort = lake;

    const page1 = query.list({ workspaceId: 'ws-1', limit: 2 });
    expect(page1.items.map((f) => f.eventId)).toEqual(['evt-trade-1', 'evt-risk-1']);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = query.list({
      workspaceId: 'ws-1',
      limit: 2,
      cursor: page1.nextCursor!,
    });
    expect(page2.items.map((f) => f.eventId)).toEqual(['evt-research-1', 'evt-trade-2']);
    expect(page2.nextCursor).toBeNull();

    const empty = query.list({
      workspaceId: 'ws-1',
      categories: ['Market'],
    });
    expect(empty.authorityClass).toBe('projection');
    expect(empty.items).toEqual([]);
    expect(empty.nextCursor).toBeNull();

    expect(query.list({ workspaceId: '' }).items).toEqual([]);
    expect(query.list({ workspaceId: 'ws-missing' }).items).toEqual([]);
  });

  it('is read-only: query port has no mutation methods and does not mutate store', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const query: KnowledgeLakeQueryPort = lake;

    // Query contract surface — no update/delete/overwrite (API Contract §5.4).
    expect(query).not.toHaveProperty('update');
    expect(query).not.toHaveProperty('delete');
    expect(query).not.toHaveProperty('overwrite');
    expect(query).not.toHaveProperty('correctInPlace');
    expect(typeof query.getByEventId).toBe('function');
    expect(typeof query.list).toBe('function');

    admit(lake, { eventId: 'evt-freeze' });
    const sizeBefore = lake.peekSize();
    const page = query.list({ workspaceId: 'ws-1' });
    const fact = query.getByEventId('evt-freeze');
    expect(lake.peekSize()).toBe(sizeBefore);
    expect(page.authorityClass).toBe('projection');
    expect(fact).toBeDefined();
    expect(Object.isFrozen(fact)).toBe(true);
    expect(() => {
      (fact as { producer: string }).producer = 'ledger';
    }).toThrow();
  });
});
