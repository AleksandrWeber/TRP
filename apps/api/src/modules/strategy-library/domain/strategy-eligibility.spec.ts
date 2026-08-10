import { describe, expect, it } from 'vitest';
import { createStrategyCertification } from './strategy-certification';
import {
  createStrategyEligibility,
  eligibilityMutatesCertification,
  eligibilityReferencesCertification,
  eligibilityRuntimeIntegrationImplemented,
  evaluateStrategyEligibility,
  replaceEligibilityRulesInPlace,
  strategyEligibilityIsImmutable,
} from './strategy-eligibility';
import { createStrategyVersion } from './strategy-version';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';

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

function makeCertification() {
  return createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: makeVersion(),
    certifiedBy: 'operator-alice',
    certifiedAt,
    evidence: requiredEvidence(),
    tacticalEnvelope: requiredEnvelope(),
  });
}

describe('RC-22 Epic 5 — StrategyEligibility', () => {
  it('marks only certified strategies with complete evidence + envelope as eligible', () => {
    const certification = makeCertification();
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });

    expect(strategyEligibilityIsImmutable(eligibility)).toBe(true);
    expect(eligibility.outcome).toBe('eligible');
    expect(eligibility.reasons).toContain('eligible');
    expect(eligibilityReferencesCertification(eligibility, certification)).toBe(true);
    expect(eligibilityMutatesCertification()).toBe(false);
    expect(eligibilityRuntimeIntegrationImplemented()).toBe(false);
    expect(eligibility).not.toHaveProperty('tradingSessionId');
    expect(eligibility).not.toHaveProperty('sessionId');
  });

  it('rejects eligibility when certification is missing (uncertified)', () => {
    const decision = evaluateStrategyEligibility({
      eligibilityId: 'elig-missing',
      certification: null,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('certification_missing');
    expect(() =>
      createStrategyEligibility({
        eligibilityId: 'elig-missing',
        certification: null,
        rulesVersion: 'rules-v1',
        evaluatedAt,
      }),
    ).toThrow(/not eligible/);
  });

  it('rejects eligibility when required evidence is incomplete', () => {
    const certification = makeCertification();
    const incomplete = Object.freeze({
      ...certification,
      evidence: Object.freeze(certification.evidence.filter((e) => e.type === 'backtesting')),
    });

    const decision = evaluateStrategyEligibility({
      eligibilityId: 'elig-ev',
      certification: incomplete,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('evidence_incomplete');
  });

  it('rejects eligibility when tactical envelope is missing', () => {
    const certification = makeCertification();
    const withoutEnvelope = Object.freeze({
      ...certification,
      tacticalEnvelope: undefined as never,
    });

    const decision = evaluateStrategyEligibility({
      eligibilityId: 'elig-env',
      certification: withoutEnvelope,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('envelope_missing');
  });

  it('rejects out-of-envelope tactic points (static domain check only)', () => {
    const certification = makeCertification();
    const decision = evaluateStrategyEligibility({
      eligibilityId: 'elig-tactic',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
      tacticPoint: { symbol: 'SOLUSDT', timeframe: '1h' },
    });
    expect(decision.outcome).toBe('ineligible');
    expect(decision.reasons).toContain('envelope_violation');
  });

  it('rejects deprecated / archived certifications', () => {
    const certification = makeCertification();
    const deprecated = Object.freeze({ ...certification, status: 'deprecated' as const });
    const archived = Object.freeze({ ...certification, status: 'archived' as const });

    expect(
      evaluateStrategyEligibility({
        eligibilityId: 'elig-dep',
        certification: deprecated,
        rulesVersion: 'rules-v1',
        evaluatedAt,
      }).reasons,
    ).toContain('certification_deprecated');

    expect(
      evaluateStrategyEligibility({
        eligibilityId: 'elig-arch',
        certification: archived,
        rulesVersion: 'rules-v1',
        evaluatedAt,
      }).reasons,
    ).toContain('certification_archived');
  });

  it('never mutates certification when evaluating eligibility', () => {
    const certification = makeCertification();
    const before = {
      certificationId: certification.certificationId,
      contentHash: certification.contentHash,
      status: certification.status,
      envelopeVersion: certification.tacticalEnvelope.envelopeVersion,
      evidenceLength: certification.evidence.length,
    };

    evaluateStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
    });

    expect(certification.certificationId).toBe(before.certificationId);
    expect(certification.contentHash).toBe(before.contentHash);
    expect(certification.status).toBe(before.status);
    expect(certification.tacticalEnvelope.envelopeVersion).toBe(before.envelopeVersion);
    expect(certification.evidence).toHaveLength(before.evidenceLength);
  });

  it('requires a new eligibility record when rules change (no in-place replace)', () => {
    const certification = makeCertification();
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });

    expect(() => replaceEligibilityRulesInPlace(eligibility, 'rules-v2')).toThrow(
      /new eligibility record/,
    );

    const next = createStrategyEligibility({
      eligibilityId: 'elig-2',
      certification,
      rulesVersion: 'rules-v2',
      evaluatedAt: '2026-08-10T15:00:00.000Z',
    });
    expect(next.rulesVersion).toBe('rules-v2');
    expect(next.eligibilityId).not.toBe(eligibility.eligibilityId);
  });
});
