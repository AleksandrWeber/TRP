import { describe, expect, it } from 'vitest';
import {
  validateAnalyticalFactAdmission,
  type AnalyticalFactAdmission,
} from './analytical-fact-admission';

function validAdmission(overrides: Partial<AnalyticalFactAdmission> = {}): AnalyticalFactAdmission {
  return {
    eventId: 'evt-1',
    occurredAt: '2026-08-10T12:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    payload: { kind: 'session_marker', status: 'ready' },
    schemaVersion: '1',
    ...overrides,
  };
}

describe('RC-21 Epic 2 — AnalyticalFactAdmission validation', () => {
  it('accepts a valid admission envelope', () => {
    expect(validateAnalyticalFactAdmission(validAdmission())).toBeNull();
  });

  it('allows System category to omit mode', () => {
    expect(
      validateAnalyticalFactAdmission(
        validAdmission({
          category: 'System',
          mode: undefined,
          producer: 'system',
        }),
      ),
    ).toBeNull();
  });

  it('rejects missing required fields', () => {
    expect(validateAnalyticalFactAdmission(validAdmission({ eventId: '  ' }))?.reason).toBe(
      'missing_event_id',
    );
    expect(validateAnalyticalFactAdmission(validAdmission({ occurredAt: '' }))?.reason).toBe(
      'missing_occurred_at',
    );
    expect(validateAnalyticalFactAdmission(validAdmission({ producer: '' }))?.reason).toBe(
      'missing_producer',
    );
    expect(validateAnalyticalFactAdmission(validAdmission({ category: '' }))?.reason).toBe(
      'missing_category',
    );
    expect(validateAnalyticalFactAdmission(validAdmission({ workspaceId: '' }))?.reason).toBe(
      'missing_workspace_id',
    );
    expect(
      validateAnalyticalFactAdmission(validAdmission({ payload: undefined as unknown as object }))
        ?.reason,
    ).toBe('missing_payload');
    expect(validateAnalyticalFactAdmission(validAdmission({ schemaVersion: '' }))?.reason).toBe(
      'missing_schema_version',
    );
  });

  it('rejects unknown category and missing mode for non-System', () => {
    expect(validateAnalyticalFactAdmission(validAdmission({ category: 'Ledger' }))?.reason).toBe(
      'unknown_category',
    );
    expect(validateAnalyticalFactAdmission(validAdmission({ mode: undefined }))?.reason).toBe(
      'missing_mode',
    );
    expect(validateAnalyticalFactAdmission(validAdmission({ mode: 'demo' }))?.reason).toBe(
      'unknown_mode',
    );
  });

  it('rejects non-JSON-serializable payload', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(validateAnalyticalFactAdmission(validAdmission({ payload: circular }))?.reason).toBe(
      'payload_not_json_serializable',
    );
  });
});
