import { describe, expect, it } from 'vitest';
import { createStrategy } from '../../strategy-library/domain/strategy';
import { createStrategyCertification } from '../../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../strategy-library/domain/strategy-eligibility';
import { deprecateStrategyCertification } from '../../strategy-library/domain/strategy-lifecycle';
import { createStrategyVersion } from '../../strategy-library/domain/strategy-version';
import type { StrategyVersionRecord } from '../../strategy-library/ports/strategy-library-lookup.port';
import { validateDeployment, type ValidateDeploymentLibraryReads } from './validate-deployment';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';
const checkedAt = '2026-08-10T16:00:00.000Z';

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

function makeStrategy(familyId = 'fam-momentum') {
  return createStrategy({
    strategyFamilyId: familyId,
    name: 'Momentum',
    workspaceId: 'ws-1',
    createdAt,
  });
}

function makeVersion(overrides?: {
  libraryEntryId?: string;
  version?: string;
  strategyFamilyId?: string;
}) {
  return createStrategyVersion({
    libraryEntryId: overrides?.libraryEntryId ?? 'lib-entry-1',
    strategyFamilyId: overrides?.strategyFamilyId ?? 'fam-momentum',
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

function makeFullRecord(opts?: {
  certification?: ReturnType<typeof createStrategyCertification> | null;
  eligibility?: ReturnType<typeof createStrategyEligibility> | null;
  includeEligibility?: boolean;
  includeCertification?: boolean;
}): StrategyVersionRecord {
  const strategy = makeStrategy();
  const version = makeVersion();
  const includeCert = opts?.includeCertification !== false;
  const certification =
    opts?.certification === null
      ? null
      : (opts?.certification ??
        (includeCert
          ? createStrategyCertification({
              certificationId: 'cert-1',
              strategyVersion: version,
              certifiedBy: 'operator-alice',
              certifiedAt,
              evidence: requiredEvidence(),
              tacticalEnvelope: requiredEnvelope(),
            })
          : null));
  const includeElig = opts?.includeEligibility !== false && certification !== null;
  const eligibility =
    opts?.eligibility === null
      ? null
      : (opts?.eligibility ??
        (includeElig && certification
          ? createStrategyEligibility({
              eligibilityId: 'elig-1',
              certification,
              rulesVersion: 'rules-v1',
              evaluatedAt,
            })
          : null));

  return Object.freeze({
    authorityClass: 'source_of_truth',
    strategy,
    version,
    certification,
    eligibility,
    tacticalEnvelope: certification?.tacticalEnvelope ?? null,
    membershipStatus: certification
      ? certification.status === 'active'
        ? 'certified'
        : certification.status === 'deprecated'
          ? 'deprecated'
          : certification.status === 'archived'
            ? 'archived'
            : 'uncertified'
      : 'uncertified',
  });
}

function makeReads(entries: StrategyVersionRecord[]): ValidateDeploymentLibraryReads {
  const byId = new Map(entries.map((e) => [String(e.version.libraryEntryId), e]));
  const byFamily = new Map(
    entries.map((e) => [`${e.strategy.strategyFamilyId}\0${e.version.version}`, e]),
  );
  return {
    getByLibraryEntryId: (id) => byId.get(id) ?? null,
    getByFamilyVersion: (familyId, version) => byFamily.get(`${familyId}\0${version}`) ?? null,
    familyExistsInWorkspace: (workspaceId, strategyFamilyId) =>
      entries.some(
        (e) =>
          e.strategy.workspaceId === workspaceId &&
          e.strategy.strategyFamilyId === strategyFamilyId,
      ),
  };
}

describe('RC-23 Epic 3 — validateDeployment Gate', () => {
  it('returns VALID/pass for a fully Library-permitted deployment', () => {
    const record = makeFullRecord();
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );

    expect(decision.outcome).toBe('pass');
    expect(decision.validation).toBe('VALID');
    expect(decision.reasons).toEqual([]);
    expect(decision.libraryEntryId).toBe('lib-entry-1');
    expect(decision.certificationStatus).toBe('active');
    expect(decision.eligibilityOutcome).toBe('eligible');
    expect(decision.checkedAt).toBe(checkedAt);
    expect(Object.isFrozen(decision)).toBe(true);
  });

  it('returns INVALID when strategy family is missing', () => {
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        strategyFamilyId: 'fam-missing',
        strategyVersion: '1.0.0',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([]),
    );
    expect(decision.validation).toBe('INVALID');
    expect(decision.outcome).toBe('fail');
    expect(decision.reasons).toEqual(['strategy_not_found']);
  });

  it('returns INVALID when strategy version is missing but family exists', () => {
    const record = makeFullRecord();
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        strategyFamilyId: 'fam-momentum',
        strategyVersion: '9.9.9',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );
    expect(decision.reasons).toEqual(['strategy_version_not_found']);
    expect(decision.validation).toBe('INVALID');
  });

  it('returns INVALID for inactive (deprecated) certification', () => {
    const version = makeVersion();
    const active = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence(),
      tacticalEnvelope: requiredEnvelope(),
    });
    const { certification: deprecated } = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: active,
      reason: 'superseded',
      deprecatedBy: 'operator-alice',
      deprecatedAt: '2026-08-10T15:00:00.000Z',
    });
    const record = makeFullRecord({
      certification: deprecated,
      eligibility: null,
      includeEligibility: false,
    });

    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'session_start',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );
    expect(decision.validation).toBe('INVALID');
    expect(decision.reasons).toEqual(['certification_deprecated']);
  });

  it('returns INVALID when eligibility record is missing', () => {
    const record = makeFullRecord({ eligibility: null, includeEligibility: false });
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );
    expect(decision.reasons).toEqual(['eligibility_missing']);
    expect(decision.validation).toBe('INVALID');
  });

  it('returns INVALID when tactical envelope is missing', () => {
    const strategy = makeStrategy();
    const version = makeVersion();
    const baseCert = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence(),
      tacticalEnvelope: requiredEnvelope(),
    });
    // Defensive SoT anomaly: active certification without envelope body.
    const certificationWithoutEnvelope = Object.freeze({
      ...baseCert,
      tacticalEnvelope: null as unknown as (typeof baseCert)['tacticalEnvelope'],
    });
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification: baseCert,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    const record: StrategyVersionRecord = Object.freeze({
      authorityClass: 'source_of_truth',
      strategy,
      version,
      certification: certificationWithoutEnvelope,
      eligibility,
      tacticalEnvelope: null,
      membershipStatus: 'certified',
    });

    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );
    expect(decision.reasons).toEqual(['envelope_missing']);
    expect(decision.validation).toBe('INVALID');
  });

  it('returns INVALID for certification_missing when uncertified', () => {
    const record = makeFullRecord({
      certification: null,
      eligibility: null,
      includeCertification: false,
      includeEligibility: false,
    });
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );
    expect(decision.reasons).toEqual(['certification_missing']);
  });

  it('is deterministic for the same Library state + request', () => {
    const record = makeFullRecord({ eligibility: null, includeEligibility: false });
    const reads = makeReads([record]);
    const cmd = {
      workspaceId: 'ws-1',
      libraryEntryId: 'lib-entry-1' as const,
      purpose: 'deployment_bind' as const,
      requestedAt: checkedAt,
    };
    const a = validateDeployment(cmd, reads);
    const b = validateDeployment(cmd, reads);
    expect(a).toEqual(b);
    expect(a.reasons).toEqual(['eligibility_missing']);
  });

  it('does not throw for expected validation failures', () => {
    expect(() =>
      validateDeployment(
        {
          workspaceId: 'ws-1',
          purpose: 'deployment_bind',
          requestedAt: checkedAt,
        },
        makeReads([]),
      ),
    ).not.toThrow();
  });

  it('resolves VALID via family + version identity', () => {
    const record = makeFullRecord();
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        strategyFamilyId: 'fam-momentum',
        strategyVersion: '1.0.0',
        purpose: 'deployment_bind',
        requestedAt: checkedAt,
      },
      makeReads([record]),
    );
    expect(decision.validation).toBe('VALID');
    expect(decision.outcome).toBe('pass');
  });
});
