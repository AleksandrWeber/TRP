import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryCertificationAdapter } from './in-memory-strategy-library-certification.adapter';
import { InMemoryStrategyLibraryReadAdapter } from './in-memory-strategy-library-read.adapter';
import type { CertifyStrategyVersionCommand } from '../ports/strategy-library-certification.port';

const workspaceId = 'ws-1';

function requiredEvidence() {
  return [
    {
      evidenceId: 'ev-bt-1',
      type: 'backtesting' as const,
      sourceRef: { owner: 'backtesting' as const, id: 'bt-1' },
    },
    {
      evidenceId: 'ev-wf-1',
      type: 'walk-forward' as const,
      sourceRef: { owner: 'walk-forward' as const, id: 'wf-1' },
    },
  ];
}

function requiredEnvelope() {
  return {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT'],
    allowedTimeframes: ['1h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
  };
}

function command(
  overrides?: Partial<CertifyStrategyVersionCommand>,
): CertifyStrategyVersionCommand {
  return {
    workspaceId,
    certifiedBy: 'operator-alice',
    notes: 'Admit paper candidate',
    family: {
      name: 'Momentum',
      registryRef: 'st-1',
    },
    version: {
      version: '1.0.0',
      contentHash: 'research:st-1:1.0.0',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h'],
      supportedSymbols: ['BTCUSDT'],
    },
    evidence: requiredEvidence(),
    tacticalEnvelope: requiredEnvelope(),
    ...overrides,
  };
}

describe('InMemoryStrategyLibraryCertificationAdapter (PC-02)', () => {
  let library: InMemoryStrategyLibraryReadAdapter;
  let certification: InMemoryStrategyLibraryCertificationAdapter;

  beforeEach(() => {
    library = new InMemoryStrategyLibraryReadAdapter();
    certification = new InMemoryStrategyLibraryCertificationAdapter(library);
  });

  it('admits a candidate into Library SoT and records a certified attempt', () => {
    const result = certification.certify(command());

    expect(result.outcome).toBe('certified');
    expect(result.progress).toBe('complete');
    expect(result.reasons).toEqual([]);
    expect(result.libraryEntryId).toBeTruthy();
    expect(result.certificationId).toBeTruthy();
    expect(result.certifiedBy).toBe('operator-alice');
    expect(result.metadata.name).toBe('Momentum');
    expect(result.metadata.evidenceTypes).toEqual(['backtesting', 'walk-forward']);

    const listed = library.list({ workspaceId });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.membershipStatus).toBe('certified');
    expect(listed.items[0]?.eligibility?.outcome).toBe('eligible');
    expect(listed.items[0]?.tacticalEnvelope).toBeTruthy();
  });

  it('rejects missing walk-forward evidence without writing Library membership', () => {
    const result = certification.certify(
      command({
        evidence: [requiredEvidence()[0]!],
      }),
    );

    expect(result.outcome).toBe('rejected');
    expect(result.reasons).toContain('missing_evidence_walk_forward');
    expect(library.list({ workspaceId }).items).toHaveLength(0);
  });

  it('conflicts when the same family version is already certified', () => {
    const first = certification.certify(command());
    expect(first.outcome).toBe('certified');

    const second = certification.certify(command());
    expect(second.outcome).toBe('conflict');
    expect(second.reasons).toContain('version_already_certified');
    expect(library.list({ workspaceId }).items).toHaveLength(1);
  });

  it('lists certification history including rejected attempts', () => {
    certification.certify(command({ evidence: [requiredEvidence()[0]!] }));
    certification.certify(command());

    const history = certification.listHistory({ workspaceId });
    expect(history.items).toHaveLength(2);
    expect(history.items.map((item) => item.outcome)).toEqual(['certified', 'rejected']);
    expect(certification.getAttempt(history.items[0]!.attemptId, workspaceId)?.outcome).toBe(
      'certified',
    );
    expect(certification.getAttempt(history.items[0]!.attemptId, 'other-ws')).toBeNull();
  });

  it('does not certify without a human certifiedBy', () => {
    const result = certification.certify(command({ certifiedBy: '   ' }));
    expect(result.outcome).toBe('rejected');
    expect(result.reasons).toContain('certified_by_required');
    expect(library.peekSize()).toBe(0);
  });
});
