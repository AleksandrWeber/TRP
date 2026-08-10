import { describe, expect, it } from 'vitest';
import type { AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from './in-memory-knowledge-lake-ingestion.adapter';
import type { KnowledgeLakeIngestionPort } from '../ports/knowledge-lake-ingestion.port';

function validAdmission(overrides: Partial<AnalyticalFactAdmission> = {}): AnalyticalFactAdmission {
  return {
    eventId: 'evt-paper-ready-1',
    occurredAt: '2026-08-10T12:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    tradingSessionId: 'session-1',
    payload: { kind: 'session_marker', status: 'ready' },
    schemaVersion: '1',
    ...overrides,
  };
}

describe('RC-21 Epic 2 — KnowledgeLakeIngestionPort', () => {
  it('admits a valid analytical fact (append-only)', () => {
    const port = new InMemoryKnowledgeLakeIngestionAdapter();
    const result = port.admit(validAdmission());

    expect(result.outcome).toBe('admitted');
    if (result.outcome !== 'admitted') {
      return;
    }
    expect(result.fact.eventId).toBe('evt-paper-ready-1');
    expect(result.fact.producer).toBe('trading-session');
    expect(result.fact.category).toBe('Trading');
    expect(result.fact.mode).toBe('paper');
    expect(result.fact.workspaceId).toBe('ws-1');
    expect(result.fact.schemaVersion).toBe('1');
    expect(result.fact.admittedAt).toBeTruthy();
    expect(port.peekSize()).toBe(1);
    expect(port.peekAppendOrder()).toEqual(['evt-paper-ready-1']);
  });

  it('treats duplicate eventId as idempotent success (first-wins)', () => {
    const port = new InMemoryKnowledgeLakeIngestionAdapter();
    const first = port.admit(
      validAdmission({
        payload: { kind: 'session_marker', status: 'ready' },
      }),
    );
    const second = port.admit(
      validAdmission({
        payload: { kind: 'session_marker', status: 'armed' },
      }),
    );

    expect(first.outcome).toBe('admitted');
    expect(second.outcome).toBe('duplicate');
    if (second.outcome !== 'duplicate' || first.outcome !== 'admitted') {
      return;
    }
    expect(second.eventId).toBe('evt-paper-ready-1');
    expect(second.fact).toBe(first.fact);
    expect(second.fact.payload).toEqual({
      kind: 'session_marker',
      status: 'ready',
    });
    expect(port.peekSize()).toBe(1);
    expect(port.peekAppendOrder()).toEqual(['evt-paper-ready-1']);
  });

  it('rejects invalid admissions without appending', () => {
    const port = new InMemoryKnowledgeLakeIngestionAdapter();
    const result = port.admit(validAdmission({ category: 'NotACategory', eventId: 'evt-bad' }));

    expect(result.outcome).toBe('rejected');
    if (result.outcome !== 'rejected') {
      return;
    }
    expect(result.reason).toBe('unknown_category');
    expect(port.peekSize()).toBe(0);
    expect(port.peekByEventId('evt-bad')).toBeUndefined();
  });

  it('keeps admitted facts immutable (contract)', () => {
    const port = new InMemoryKnowledgeLakeIngestionAdapter();
    const result = port.admit(
      validAdmission({
        payload: { nested: { value: 1 } },
      }),
    );
    expect(result.outcome).toBe('admitted');
    if (result.outcome !== 'admitted') {
      return;
    }

    expect(Object.isFrozen(result.fact)).toBe(true);
    expect(Object.isFrozen(result.fact.payload)).toBe(true);
    expect(Object.isFrozen((result.fact.payload as { nested: { value: number } }).nested)).toBe(
      true,
    );

    expect(() => {
      (result.fact as { producer: string }).producer = 'orders';
    }).toThrow();
    expect(() => {
      (result.fact.payload as { nested: { value: number } }).nested.value = 99;
    }).toThrow();

    const stored = port.peekByEventId(result.fact.eventId);
    expect(stored?.producer).toBe('trading-session');
    expect(stored?.payload).toEqual({ nested: { value: 1 } });
  });

  it('guarantees append-only: no update/delete surface; corrections need new eventId', () => {
    const port: KnowledgeLakeIngestionPort = new InMemoryKnowledgeLakeIngestionAdapter();
    const adapter = port as InMemoryKnowledgeLakeIngestionAdapter;

    const a = port.admit(validAdmission({ eventId: 'evt-a' }));
    const b = port.admit(validAdmission({ eventId: 'evt-b' }));
    expect(a.outcome).toBe('admitted');
    expect(b.outcome).toBe('admitted');

    expect(port).not.toHaveProperty('update');
    expect(port).not.toHaveProperty('delete');
    expect(port).not.toHaveProperty('overwrite');
    expect(port).not.toHaveProperty('correctInPlace');

    // Correction path: new eventId (optional correlation), never mutate evt-a.
    const correction = port.admit(
      validAdmission({
        eventId: 'evt-a-correction',
        correlationId: 'evt-a',
        payload: {
          kind: 'session_marker',
          status: 'ready',
          compensating: true,
        },
      }),
    );
    expect(correction.outcome).toBe('admitted');
    expect(adapter.peekSize()).toBe(3);
    expect(adapter.peekAppendOrder()).toEqual(['evt-a', 'evt-b', 'evt-a-correction']);
    expect(adapter.peekByEventId('evt-a')?.payload).toEqual({
      kind: 'session_marker',
      status: 'ready',
    });
  });

  it('admitMany applies the same per-fact semantics', () => {
    const port = new InMemoryKnowledgeLakeIngestionAdapter();
    const results = port.admitMany([
      validAdmission({ eventId: 'evt-1' }),
      validAdmission({ eventId: 'evt-1' }),
      validAdmission({ eventId: 'evt-2', category: 'Bogus' }),
      validAdmission({
        eventId: 'evt-3',
        category: 'System',
        mode: undefined,
        producer: 'system',
      }),
    ]);

    expect(results.map((r) => r.outcome)).toEqual([
      'admitted',
      'duplicate',
      'rejected',
      'admitted',
    ]);
    expect(port.peekSize()).toBe(2);
    expect(port.peekByEventId('evt-3')?.mode).toBe('system');
  });
});
