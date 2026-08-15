import { describe, expect, it } from 'vitest';
import { createStrategy } from './domain/strategy';
import { createStrategyVersion } from './domain/strategy-version';
import type { StrategyVersionRecord } from './ports/strategy-library-lookup.port';
import {
  parseIncludeArchived,
  parseMembershipStatuses,
  recordMatchesQuery,
  toLibraryRecordView,
} from './strategy-library.view';

const createdAt = '2026-08-10T12:00:00.000Z';

function record(): StrategyVersionRecord {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId: 'ws-1',
    createdAt,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedSymbols: ['BTCUSDT'],
    workspaceId: 'ws-1',
    createdAt,
  });
  return Object.freeze({
    authorityClass: 'source_of_truth',
    strategy,
    version,
    certification: null,
    eligibility: null,
    tacticalEnvelope: null,
    membershipStatus: 'uncertified',
  });
}

describe('Strategy Library HTTP view (PC-01)', () => {
  it('marks versions immutable and envelopes empty when unbound', () => {
    const view = toLibraryRecordView(record());
    expect(view.authorityClass).toBe('source_of_truth');
    expect(view.version.immutable).toBe(true);
    expect(view.envelopeState).toBe('empty');
    expect(view.certification).toBeNull();
    expect(view.membershipStatus).toBe('uncertified');
  });

  it('filters listed records by name, family, version, or id', () => {
    expect(recordMatchesQuery(record(), 'momentum')).toBe(true);
    expect(recordMatchesQuery(record(), 'lib-entry-1')).toBe(true);
    expect(recordMatchesQuery(record(), '1.0.0')).toBe(true);
    expect(recordMatchesQuery(record(), 'mean-reversion')).toBe(false);
  });

  it('parses membership statuses and includeArchived without inventing values', () => {
    expect(parseMembershipStatuses('certified,deprecated')).toEqual(['certified', 'deprecated']);
    expect(parseIncludeArchived('true')).toBe(true);
    expect(parseIncludeArchived(undefined)).toBe(false);
    expect(() => parseMembershipStatuses('live')).toThrow(/invalid membership status/);
  });
});
