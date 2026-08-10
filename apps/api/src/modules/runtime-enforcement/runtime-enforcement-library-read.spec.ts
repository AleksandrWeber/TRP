import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../strategy-library/domain/strategy';
import { createStrategyCertification } from '../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../strategy-library/domain/strategy-version';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';
import { RuntimeEnforcementModule } from './runtime-enforcement.module';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';

function seedEligibleEntry(adapter: InMemoryStrategyLibraryReadAdapter) {
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
    supportedTimeframes: ['1h', '4h'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
    workspaceId: 'ws-1',
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt,
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: {
      envelopeVersion: 'env-1',
      allowedMarkets: ['crypto-spot'],
      allowedExchangeScopeIds: ['binance-spot'],
      allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
      allowedTimeframes: ['1h', '4h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt,
  });
  return adapter.seedEntry({ strategy, version, certification, eligibility });
}

describe('RC-23 Epic 2 — Runtime Enforcement Library read integration', () => {
  it('reads Strategy / Version / Certification / Eligibility / Envelope via Library ports', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const adapter = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
    seedEligibleEntry(adapter);

    const reads = moduleRef.get(RuntimeEnforcementLibraryReadService);
    const facts = reads.readLibraryFacts('lib-entry-1');

    expect(facts.found).toBe(true);
    expect(facts.strategy?.strategyFamilyId).toBe('fam-momentum');
    expect(facts.version?.version).toBe('1.0.0');
    expect(facts.certification?.status).toBe('active');
    expect(facts.eligibility?.outcome).toBe('eligible');
    expect(facts.tacticalEnvelope?.envelopeVersion).toBe('env-1');
    expect(facts.record?.authorityClass).toBe('source_of_truth');
    expect(Object.isFrozen(facts.record)).toBe(true);

    const byFamily = reads.getByFamilyVersion('fam-momentum', '1.0.0');
    expect(byFamily?.version.libraryEntryId).toBe('lib-entry-1');

    const decision = reads.checkEligibility({
      libraryEntryId: 'lib-entry-1',
      workspaceId: 'ws-1',
      purpose: 'deployment_bind',
    });
    expect(decision.outcome).toBe('eligible');
    expect(decision.status).toBe('certified');

    await moduleRef.close();
  });

  it('returns expected lookup results when objects are missing', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const reads = moduleRef.get(RuntimeEnforcementLibraryReadService);
    expect(reads.getByLibraryEntryId('missing')).toBeNull();
    expect(reads.readLibraryFacts('missing').found).toBe(false);

    const decision = reads.checkEligibility({
      libraryEntryId: 'missing',
      workspaceId: 'ws-1',
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('unknown_entry');

    await moduleRef.close();
  });

  it('cannot mutate Library SoT through Enforcement read results', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const adapter = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
    seedEligibleEntry(adapter);
    const reads = moduleRef.get(RuntimeEnforcementLibraryReadService);
    const record = reads.getByLibraryEntryId('lib-entry-1');
    expect(record).not.toBeNull();

    expect(() => {
      (record as { membershipStatus: string }).membershipStatus = 'archived';
    }).toThrow();

    expect(() => {
      (record!.certification as { status: string }).status = 'archived';
    }).toThrow();

    const again = reads.getByLibraryEntryId('lib-entry-1');
    expect(again?.membershipStatus).toBe('certified');
    expect(again?.certification?.status).toBe('active');

    await moduleRef.close();
  });

  it('does not introduce Session/Deployment product hooks via Library read service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const reads = moduleRef.get(RuntimeEnforcementLibraryReadService);
    expect(reads).not.toHaveProperty('startSession');
    expect(reads).not.toHaveProperty('bindDeployment');

    await moduleRef.close();
  });
});
