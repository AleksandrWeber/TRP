import { describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../domain/strategy';
import { createStrategyCertification } from '../domain/strategy-certification';
import {
  createStrategyEligibility,
  evaluateStrategyEligibility,
} from '../domain/strategy-eligibility';
import { deprecateStrategyCertification } from '../domain/strategy-lifecycle';
import { createStrategyVersion } from '../domain/strategy-version';
import { STRATEGY_LIBRARY_ELIGIBILITY_PORT } from './strategy-library-eligibility.port';
import { STRATEGY_LIBRARY_LOOKUP_PORT } from './strategy-library-lookup.port';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';

function requiredEvidence() {
  return [
    {
      evidenceId: 'ev-bt-1',
      type: 'backtesting' as const,
      sourceRef: { owner: 'backtesting', id: 'bt-1' },
    },
    {
      evidenceId: 'ev-wf-1',
      type: 'walk-forward' as const,
      sourceRef: { owner: 'walk-forward', id: 'wf-1' },
    },
  ];
}

function requiredEnvelope() {
  return {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
    allowedTimeframes: ['1h', '4h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
  };
}

function makeStrategy() {
  return createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId: 'ws-1',
    createdAt,
  });
}

function makeVersion(overrides?: { libraryEntryId?: string; version?: string }) {
  return createStrategyVersion({
    libraryEntryId: overrides?.libraryEntryId ?? 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: overrides?.version ?? '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h', '4h'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
    workspaceId: 'ws-1',
    createdAt,
  });
}

function makeCertification(version = makeVersion()) {
  return createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt,
    evidence: requiredEvidence(),
    tacticalEnvelope: requiredEnvelope(),
  });
}

describe('RC-23 Epic 2 — Strategy Library Lookup + Eligibility ports', () => {
  it('exposes Nest injection tokens', () => {
    expect(typeof STRATEGY_LIBRARY_LOOKUP_PORT).toBe('symbol');
    expect(typeof STRATEGY_LIBRARY_ELIGIBILITY_PORT).toBe('symbol');
  });

  it('returns immutable found records with Strategy / Version / Cert / Eligibility / Envelope', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    const strategy = makeStrategy();
    const version = makeVersion();
    const certification = makeCertification(version);
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });

    const seeded = adapter.seedEntry({ strategy, version, certification, eligibility });
    expect(Object.isFrozen(seeded)).toBe(true);
    expect(seeded.authorityClass).toBe('source_of_truth');
    expect(seeded.membershipStatus).toBe('certified');
    expect(seeded.strategy.name).toBe('Momentum');
    expect(seeded.version.libraryEntryId).toBe('lib-entry-1');
    expect(seeded.certification?.status).toBe('active');
    expect(seeded.eligibility?.outcome).toBe('eligible');
    expect(seeded.tacticalEnvelope?.envelopeVersion).toBe('env-1');

    const byId = adapter.getByLibraryEntryId('lib-entry-1');
    expect(byId).not.toBeNull();
    expect(Object.isFrozen(byId)).toBe(true);
    expect(byId?.tacticalEnvelope).toBe(certification.tacticalEnvelope);

    const byFamily = adapter.getByFamilyVersion('fam-momentum', '1.0.0');
    expect(byFamily?.version.libraryEntryId).toBe('lib-entry-1');
  });

  it('returns null for missing library entry / family version', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    expect(adapter.getByLibraryEntryId('missing')).toBeNull();
    expect(adapter.getByFamilyVersion('fam-x', '9.9.9')).toBeNull();
    expect(adapter.getByLibraryEntryId('')).toBeNull();
  });

  it('exposes uncertified version without eligibility or envelope', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    const record = adapter.seedEntry({
      strategy: makeStrategy(),
      version: makeVersion(),
    });
    expect(record.membershipStatus).toBe('uncertified');
    expect(record.certification).toBeNull();
    expect(record.eligibility).toBeNull();
    expect(record.tacticalEnvelope).toBeNull();
  });

  it('reports deprecated certification as inactive membership for eligibility', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    const version = makeVersion();
    const active = makeCertification(version);
    const { certification: deprecated } = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: active,
      reason: 'superseded',
      deprecatedBy: 'operator-alice',
      deprecatedAt: '2026-08-10T15:00:00.000Z',
    });

    adapter.seedEntry({
      strategy: makeStrategy(),
      version,
      certification: deprecated,
    });

    const decision = adapter.checkEligibility({
      libraryEntryId: 'lib-entry-1',
      workspaceId: 'ws-1',
      purpose: 'deployment_bind',
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.status).toBe('deprecated');
    expect(decision.reasons).toContain('certification_deprecated');
    expect(Object.isFrozen(decision)).toBe(true);
  });

  it('returns ineligible for missing eligibility when certification absent', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    adapter.seedEntry({
      strategy: makeStrategy(),
      version: makeVersion(),
    });

    const decision = adapter.checkEligibility({
      libraryEntryId: 'lib-entry-1',
      workspaceId: 'ws-1',
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('certification_missing');
  });

  it('returns unknown_entry for missing library identity', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    const decision = adapter.checkEligibility({
      libraryEntryId: 'does-not-exist',
      workspaceId: 'ws-1',
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('unknown_entry');
    expect(decision.status).toBe('unknown');
  });

  it('does not mutate seeded Library domain objects via lookup results', () => {
    const adapter = new InMemoryStrategyLibraryReadAdapter();
    const certification = makeCertification();
    const strategy = makeStrategy();
    const version = makeVersion();
    adapter.seedEntry({ strategy, version, certification });

    const record = adapter.getByLibraryEntryId('lib-entry-1');
    expect(record).not.toBeNull();
    expect(() => {
      (record as { membershipStatus: string }).membershipStatus = 'archived';
    }).toThrow();
    expect(certification.status).toBe('active');
    expect(
      evaluateStrategyEligibility({
        eligibilityId: 'probe',
        certification,
        rulesVersion: 'rules-v1',
        evaluatedAt,
      }).outcome,
    ).toBe('eligible');
  });
});
