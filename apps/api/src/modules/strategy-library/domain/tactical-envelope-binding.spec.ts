import { describe, expect, it } from 'vitest';
import {
  createLibraryTacticalEnvelope,
  libraryTacticalEnvelopeIsImmutable,
  replaceLibraryTacticalEnvelopeInPlace,
} from './library-tactical-envelope';
import {
  appendStrategyCertification,
  createStrategyCertification,
  replaceCertificationTacticalEnvelope,
} from './strategy-certification';
import { createStrategyVersion } from './strategy-version';
import {
  assertOneEnvelopePerCertification,
  assertEnvelopeCompatibleWithStrategyVersion,
  bindTacticalEnvelopeToCertification,
  tacticalEnvelopeRuntimeAdaptationImplemented,
} from './tactical-envelope-binding';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';

function makeVersion() {
  return createStrategyVersion({
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
}

function requiredEvidence() {
  return [
    {
      evidenceId: 'ev-bt-1',
      type: 'backtesting' as const,
      sourceRef: { owner: 'backtesting', id: 'bt-session-1' },
    },
    {
      evidenceId: 'ev-wf-1',
      type: 'walk-forward' as const,
      sourceRef: { owner: 'walk-forward', id: 'wf-agg-1' },
    },
  ];
}

function makeEnvelopeInput(
  overrides?: Partial<Parameters<typeof createLibraryTacticalEnvelope>[0]>,
) {
  return {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT'],
    allowedTimeframes: ['1h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
    parameterLimits: { riskPct: { min: 0.25, max: 1 } },
    executionConstraints: { maxOrdersPerDay: 20, allowedOrderTypes: ['LIMIT', 'MARKET'] },
    optionalFilters: ['trend-filter'],
    provenanceRefs: ['campaign-1'],
    ...overrides,
  };
}

describe('RC-22 Epic 4 — LibraryTacticalEnvelope', () => {
  it('creates an immutable configuration envelope', () => {
    const envelope = createLibraryTacticalEnvelope(makeEnvelopeInput());
    expect(libraryTacticalEnvelopeIsImmutable(envelope)).toBe(true);
    expect(envelope.allowedSymbols).toEqual(['BTCUSDT']);
    expect(envelope.riskPerTrade).toEqual({ min: 0.25, max: 1, step: 0.25 });
    expect(tacticalEnvelopeRuntimeAdaptationImplemented()).toBe(false);
  });

  it('rejects in-place envelope replacement', () => {
    const envelope = createLibraryTacticalEnvelope(makeEnvelopeInput());
    expect(() =>
      replaceLibraryTacticalEnvelopeInPlace(
        envelope,
        makeEnvelopeInput({ envelopeVersion: 'env-2', allowedSymbols: ['ETHUSDT'] }),
      ),
    ).toThrow(/new certification/);
  });

  it('rejects empty allowlists and inverted ranges', () => {
    expect(() => createLibraryTacticalEnvelope(makeEnvelopeInput({ allowedSymbols: [] }))).toThrow(
      /allowedSymbols/,
    );
    expect(() =>
      createLibraryTacticalEnvelope(makeEnvelopeInput({ riskPerTrade: { min: 2, max: 1 } })),
    ).toThrow(/min must be <=/);
  });
});

describe('RC-22 Epic 4 — Tactical Envelope binding', () => {
  it('binds one immutable envelope to a certification without mutating StrategyVersion', () => {
    const version = makeVersion();
    const hashBefore = version.contentHash;
    const envelope = createLibraryTacticalEnvelope(makeEnvelopeInput());

    const binding = bindTacticalEnvelopeToCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      envelope,
    });

    expect(Object.isFrozen(binding)).toBe(true);
    expect(binding.envelope.envelopeVersion).toBe('env-1');
    expect(version.contentHash).toBe(hashBefore);
    expect(version).not.toHaveProperty('tacticalEnvelope');
  });

  it('enforces one envelope per certification', () => {
    const version = makeVersion();
    const first = bindTacticalEnvelopeToCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      envelope: makeEnvelopeInput(),
    });
    const second = bindTacticalEnvelopeToCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      envelope: makeEnvelopeInput({ envelopeVersion: 'env-2', allowedSymbols: ['ETHUSDT'] }),
    });
    expect(() => assertOneEnvelopePerCertification(first, second)).toThrow(/new certification/);
  });

  it('requires a new certification to change envelope', () => {
    const version = makeVersion();
    const certification = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence(),
      tacticalEnvelope: makeEnvelopeInput(),
    });

    expect(() =>
      replaceCertificationTacticalEnvelope(
        certification,
        makeEnvelopeInput({ envelopeVersion: 'env-2', allowedSymbols: ['ETHUSDT'] }),
      ),
    ).toThrow(/new certification/);

    const nextVersion = createStrategyVersion({
      libraryEntryId: 'lib-entry-2',
      strategyFamilyId: 'fam-momentum',
      version: '1.1.0',
      contentHash: 'sha256:def',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h', '4h'],
      supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
      workspaceId: 'ws-1',
      createdAt,
    });
    const nextCertification = createStrategyCertification({
      certificationId: 'cert-2',
      strategyVersion: nextVersion,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: requiredEvidence().map((e) => ({ ...e, evidenceId: `${e.evidenceId}-v2` })),
      tacticalEnvelope: makeEnvelopeInput({
        envelopeVersion: 'env-2',
        allowedSymbols: ['ETHUSDT'],
      }),
    });
    expect(nextCertification.tacticalEnvelope.envelopeVersion).toBe('env-2');
    expect(appendStrategyCertification([certification], nextCertification)).toHaveLength(2);
  });

  it('rejects envelope points outside StrategyVersion allowlists', () => {
    const version = makeVersion();
    expect(() =>
      assertEnvelopeCompatibleWithStrategyVersion(
        createLibraryTacticalEnvelope(makeEnvelopeInput({ allowedSymbols: ['SOLUSDT'] })),
        version,
      ),
    ).toThrow(/SOLUSDT/);
  });

  it('requires tactical envelope on certification', () => {
    const version = makeVersion();
    expect(() =>
      createStrategyCertification({
        certificationId: 'cert-1',
        strategyVersion: version,
        certifiedBy: 'operator-alice',
        certifiedAt,
        evidence: requiredEvidence(),
        tacticalEnvelope: undefined as never,
      }),
    ).toThrow();
  });
});
