import { describe, expect, it } from 'vitest';
import {
  CERTIFICATION_EVIDENCE_TYPES,
  createCertificationEvidence,
  certificationEvidenceIsImmutable,
} from './certification-evidence';
import {
  appendStrategyCertification,
  assertUniqueActiveCertification,
  certificationReferencesStrategyVersion,
  createStrategyCertification,
  isActiveStrategyCertification,
  strategyCertificationLifecycleTransitionsImplemented,
} from './strategy-certification';
import { createStrategyVersion } from './strategy-version';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';

function makeVersion(overrides?: Partial<Parameters<typeof createStrategyVersion>[0]>) {
  return createStrategyVersion({
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
    ...overrides,
  });
}

function requiredEvidence() {
  return [
    {
      evidenceId: 'ev-bt-1',
      type: 'backtesting' as const,
      sourceRef: { owner: 'backtesting', id: 'bt-session-1' },
      summary: 'fee-aware backtest',
    },
    {
      evidenceId: 'ev-wf-1',
      type: 'walk-forward' as const,
      sourceRef: { owner: 'walk-forward', id: 'wf-agg-1' },
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

describe('RC-22 Epic 3 — CertificationEvidence', () => {
  it('creates immutable evidence references without cloning artifact bodies', () => {
    const evidence = createCertificationEvidence({
      evidenceId: 'ev-1',
      type: 'monte-carlo',
      sourceRef: { owner: 'monte-carlo', id: 'mc-run-9' },
      summary: 'optional until engine matures',
    });
    expect(certificationEvidenceIsImmutable(evidence)).toBe(true);
    expect(evidence.sourceRef).toEqual({ owner: 'monte-carlo', id: 'mc-run-9' });
    expect(CERTIFICATION_EVIDENCE_TYPES).toEqual(
      expect.arrayContaining([
        'backtesting',
        'walk-forward',
        'monte-carlo',
        'paper-trading',
        'statistical-validation',
      ]),
    );
  });

  it('rejects unknown evidence types and empty source refs', () => {
    expect(() =>
      createCertificationEvidence({
        evidenceId: 'ev-x',
        type: 'profit-screenshot',
        sourceRef: { owner: 'research-lab', id: 'x' },
      }),
    ).toThrow(/unknown certification evidence type/);
    expect(() =>
      createCertificationEvidence({
        evidenceId: 'ev-x',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: ' ' },
      }),
    ).toThrow(/sourceRef.id/);
  });
});

describe('RC-22 Epic 3 — StrategyCertification', () => {
  it('certifies by referencing an immutable StrategyVersion without mutating it', () => {
    const version = makeVersion();
    const before = structuredClone({
      libraryEntryId: version.libraryEntryId,
      contentHash: version.contentHash,
      version: version.version,
    });

    const certification = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      notes: 'admitted after WF',
      evidence: [
        ...requiredEvidence(),
        {
          evidenceId: 'ev-pt-1',
          type: 'paper-trading',
          sourceRef: { owner: 'paper-trading', id: 'paper-run-1' },
        },
        {
          evidenceId: 'ev-stat-1',
          type: 'statistical-validation',
          sourceRef: { owner: 'statistical-validation', id: 'stats-1' },
        },
      ],
      tacticalEnvelope: requiredEnvelope(),
    });

    expect(Object.isFrozen(certification)).toBe(true);
    expect(Object.isFrozen(certification.evidence)).toBe(true);
    expect(Object.isFrozen(certification.tacticalEnvelope)).toBe(true);
    expect(certification.tacticalEnvelope.envelopeVersion).toBe('env-1');
    expect(isActiveStrategyCertification(certification)).toBe(true);
    expect(certification.status).toBe('active');
    expect(certification.decision).toBe('admitted');
    expect(certificationReferencesStrategyVersion(certification, version)).toBe(true);
    expect(version.libraryEntryId).toBe(before.libraryEntryId);
    expect(version.contentHash).toBe(before.contentHash);
    expect(version.version).toBe(before.version);
    expect(version).not.toHaveProperty('status');
    expect(version).not.toHaveProperty('certification');
    expect(strategyCertificationLifecycleTransitionsImplemented()).toBe(true);
  });

  it('rejects certification when required evidence refs are missing', () => {
    const version = makeVersion();
    expect(() =>
      createStrategyCertification({
        certificationId: 'cert-missing',
        strategyVersion: version,
        certifiedBy: 'operator-alice',
        certifiedAt,
        evidence: [
          {
            evidenceId: 'ev-bt-1',
            type: 'backtesting',
            sourceRef: { owner: 'backtesting', id: 'bt-1' },
          },
        ],
        tacticalEnvelope: requiredEnvelope(),
      }),
    ).toThrow(/walk-forward/);
  });

  it('rejects duplicate active certification for the same StrategyVersion', () => {
    const version = makeVersion();
    const first = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence(),
      tacticalEnvelope: requiredEnvelope(),
    });
    const second = createStrategyCertification({
      certificationId: 'cert-2',
      strategyVersion: version,
      certifiedBy: 'operator-bob',
      certifiedAt,
      evidence: requiredEvidence().map((e, i) => ({
        ...e,
        evidenceId: `${e.evidenceId}-b${i}`,
      })),
      tacticalEnvelope: requiredEnvelope(),
    });

    expect(() => assertUniqueActiveCertification([first], second)).toThrow(
      /already has an active certification/,
    );
    expect(() => appendStrategyCertification([first], second)).toThrow(
      /already has an active certification/,
    );
    expect(appendStrategyCertification([], first)).toHaveLength(1);
  });

  it('never mutates StrategyVersion when appending certifications', () => {
    const version = makeVersion();
    const frozenHash = version.contentHash;
    const certification = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence(),
      tacticalEnvelope: requiredEnvelope(),
    });
    appendStrategyCertification([], certification);
    expect(version.contentHash).toBe(frozenHash);
    expect(() => {
      (version as { contentHash: string }).contentHash = 'sha256:mutated';
    }).toThrow();
  });

  it('stores evidence as references (sourceRef), not owned artifact bodies', () => {
    const version = makeVersion();
    const certification = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence(),
      tacticalEnvelope: requiredEnvelope(),
    });
    for (const item of certification.evidence) {
      expect(item.sourceRef.id).toBeTruthy();
      expect(item.sourceRef.owner).toBeTruthy();
      expect(item).not.toHaveProperty('resultBlob');
      expect(item).not.toHaveProperty('payload');
    }
  });

  it('requires human certifiedBy', () => {
    const version = makeVersion();
    expect(() =>
      createStrategyCertification({
        certificationId: 'cert-1',
        strategyVersion: version,
        certifiedBy: '  ',
        certifiedAt,
        evidence: requiredEvidence(),
        tacticalEnvelope: requiredEnvelope(),
      }),
    ).toThrow(/certifiedBy/);
  });
});
