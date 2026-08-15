import { describe, expect, it } from 'vitest';
import { toRuntimeValidationHistoryView, toRuntimeValidationView } from './runtime-validation.view';
import type { RuntimeValidationRecord } from './runtime-validation.record';

const record: RuntimeValidationRecord = Object.freeze({
  validationId: 'val-1',
  workspaceId: 'ws-1',
  progress: 'complete',
  outcome: 'fail',
  validation: 'INVALID',
  reasons: Object.freeze(['certification_deprecated'] as const),
  libraryEntryId: 'lib-entry-1',
  strategyFamilyId: 'fam-momentum',
  strategyVersion: '1.0.0',
  strategyName: 'Momentum',
  purpose: 'deployment_bind',
  exchangeScopeId: 'binance-spot',
  certificationStatus: 'deprecated',
  eligibilityOutcome: 'ineligible',
  checkedAt: '2026-08-15T16:00:00.000Z',
  createdAt: '2026-08-15T16:00:00.000Z',
});

describe('Runtime validation view (PC-04)', () => {
  it('maps Gate decision fields without adding authority', () => {
    const view = toRuntimeValidationView(record);
    expect(view.outcome).toBe('fail');
    expect(view.validation).toBe('INVALID');
    expect(view.reasons).toEqual(['certification_deprecated']);
    expect(view.strategyVersion).toBe('1.0.0');
    expect(view.checkedAt).toBe('2026-08-15T16:00:00.000Z');
  });

  it('maps history items in order', () => {
    const page = toRuntimeValidationHistoryView([record]);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.validationId).toBe('val-1');
  });
});
