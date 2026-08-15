import { describe, expect, it } from 'vitest';
import type { CertificationAttemptRecord } from './ports/strategy-library-certification.port';
import {
  toCertificationAttemptView,
  toCertificationHistoryView,
} from './strategy-library-certification.view';

const record: CertificationAttemptRecord = Object.freeze({
  attemptId: 'attempt-1',
  workspaceId: 'ws-1',
  outcome: 'rejected',
  progress: 'complete',
  reasons: Object.freeze(['missing_evidence_walk_forward']),
  libraryEntryId: null,
  certificationId: null,
  certifiedBy: 'operator-alice',
  certifiedAt: null,
  createdAt: '2026-08-15T12:00:00.000Z',
  notes: null,
  metadata: Object.freeze({
    strategyFamilyId: 'fam-st-1',
    name: 'Momentum',
    version: '1.0.0',
    contentHash: 'research:st-1:1.0.0',
    registryRef: 'st-1',
    evidenceTypes: Object.freeze(['backtesting']),
    envelopeVersion: 'env-1',
  }),
});

describe('certification views (PC-02)', () => {
  it('projects attempt history without adding authority', () => {
    const view = toCertificationAttemptView(record);
    expect(view.outcome).toBe('rejected');
    expect(view.reasons).toEqual(['missing_evidence_walk_forward']);
    expect(view.progress).toBe('complete');
    expect(toCertificationHistoryView([record]).items).toHaveLength(1);
  });
});
