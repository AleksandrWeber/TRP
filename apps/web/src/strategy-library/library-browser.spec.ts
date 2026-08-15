import { describe, expect, it } from 'vitest';
import type { StrategyLibraryRecordView } from '../shared/api';
import { groupLibraryByFamily, libraryListQuery, membershipLabel } from './library-browser';

function record(
  overrides: Partial<StrategyLibraryRecordView['version']> & {
    name?: string;
    status?: StrategyLibraryRecordView['membershipStatus'];
  } = {},
): StrategyLibraryRecordView {
  return {
    authorityClass: 'source_of_truth',
    membershipStatus: overrides.status ?? 'certified',
    strategy: {
      strategyFamilyId: 'fam-momentum',
      name: overrides.name ?? 'Momentum',
      description: null,
      registryRef: null,
      workspaceId: 'ws-1',
      createdAt: '2026-08-10T12:00:00.000Z',
    },
    version: {
      libraryEntryId: overrides.libraryEntryId ?? 'lib-entry-1',
      strategyFamilyId: 'fam-momentum',
      version: overrides.version ?? '1.0.0',
      contentHash: 'sha256:abc',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h'],
      supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT'] },
      workspaceId: 'ws-1',
      createdAt: overrides.createdAt ?? '2026-08-10T12:00:00.000Z',
      immutable: true,
    },
    certification: {
      certificationId: 'cert-1',
      status: 'active',
      decision: 'admitted',
      certifiedAt: '2026-08-10T13:00:00.000Z',
      certifiedBy: 'operator-alice',
      notes: null,
      contentHash: 'sha256:abc',
      evidence: [],
    },
    eligibility: {
      eligibilityId: 'elig-1',
      outcome: 'eligible',
      reasons: ['eligible'],
      rulesVersion: 'rules-v1',
      evaluatedAt: '2026-08-10T14:00:00.000Z',
    },
    tacticalEnvelope: null,
    envelopeState: 'empty',
  };
}

describe('Strategy Library browser helpers (PC-01)', () => {
  it('maps membership filters onto Lookup list query params', () => {
    expect(libraryListQuery('certified', '')).toEqual({ limit: 100 });
    expect(libraryListQuery('deprecated', 'mom')).toEqual({
      limit: 100,
      q: 'mom',
      statuses: 'deprecated',
    });
    expect(libraryListQuery('archived', '')).toEqual({
      limit: 100,
      statuses: 'archived',
      includeArchived: true,
    });
    expect(libraryListQuery('all', '')?.statuses).toContain('certified');
  });

  it('groups versions under a family for version history', () => {
    const groups = groupLibraryByFamily([
      record({ version: '1.0.0', libraryEntryId: 'lib-1', createdAt: '2026-08-10T12:00:00.000Z' }),
      record({ version: '1.1.0', libraryEntryId: 'lib-2', createdAt: '2026-08-11T12:00:00.000Z' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.versions.map((item) => item.version.version)).toEqual(['1.1.0', '1.0.0']);
    expect(membershipLabel('deprecated')).toBe('Deprecated');
  });
});
