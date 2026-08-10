import { describe, expect, it } from 'vitest';
import { createStrategyCertification } from './strategy-certification';
import { createStrategyEligibility, evaluateStrategyEligibility } from './strategy-eligibility';
import {
  appendStrategyLifecycleRecord,
  archiveStrategyCertification,
  canReceiveNewEligibilityRecord,
  deprecateStrategyCertification,
  isHistoricallyQueryable,
  listLifecycleHistoryForCertification,
  strategyLifecycleHardDeleteImplemented,
  strategyLifecycleRecordIsImmutable,
  strategyLifecycleTransitionsImplemented,
} from './strategy-lifecycle';
import { createStrategyVersion } from './strategy-version';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const deprecatedAt = '2026-08-10T15:00:00.000Z';
const archivedAt = '2026-08-10T16:00:00.000Z';

function makeCertification() {
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
  return createStrategyCertification({
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
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['1h'],
      riskPerTrade: { min: 0.25, max: 1 },
      maxPositions: { min: 1, max: 2 },
    },
  });
}

describe('RC-22 Epic 6 — Strategy lifecycle', () => {
  it('deprecates by creating a lifecycle record without mutating the original certification', () => {
    const original = makeCertification();
    const result = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: original,
      reason: 'edge decay',
      deprecatedBy: 'operator-bob',
      deprecatedAt,
    });

    expect(original.status).toBe('active');
    expect(result.certification.status).toBe('deprecated');
    expect(result.certification.contentHash).toBe(original.contentHash);
    expect(result.certification.tacticalEnvelope).toBe(original.tacticalEnvelope);
    expect(strategyLifecycleRecordIsImmutable(result.lifecycleRecord)).toBe(true);
    expect(result.lifecycleRecord.fromPhase).toBe('certified');
    expect(result.lifecycleRecord.toPhase).toBe('deprecated');
    expect(isHistoricallyQueryable('deprecated')).toBe(true);
    expect(canReceiveNewEligibilityRecord(result.certification)).toBe(false);
    expect(strategyLifecycleTransitionsImplemented()).toBe(true);
    expect(strategyLifecycleHardDeleteImplemented()).toBe(false);
  });

  it('archives from deprecated and keeps history queryable', () => {
    const original = makeCertification();
    const deprecated = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: original,
      reason: 'edge decay',
      deprecatedBy: 'operator-bob',
      deprecatedAt,
    });
    const archived = archiveStrategyCertification({
      lifecycleRecordId: 'lc-2',
      certification: deprecated.certification,
      reason: 'retention hygiene',
      archivedBy: 'operator-carol',
      archivedAt,
    });

    expect(archived.certification.status).toBe('archived');
    expect(archived.certification.contentHash).toBe(original.contentHash);
    expect(isHistoricallyQueryable('archived')).toBe(true);

    const history = appendStrategyLifecycleRecord(
      appendStrategyLifecycleRecord([], deprecated.lifecycleRecord),
      archived.lifecycleRecord,
    );
    expect(listLifecycleHistoryForCertification(history, 'cert-1')).toHaveLength(2);
  });

  it('allows certified → archived directly', () => {
    const original = makeCertification();
    const archived = archiveStrategyCertification({
      lifecycleRecordId: 'lc-arch',
      certification: original,
      reason: 'immediate withdrawal',
      archivedBy: 'operator-bob',
      archivedAt,
    });
    expect(archived.lifecycleRecord.fromPhase).toBe('certified');
    expect(archived.lifecycleRecord.toPhase).toBe('archived');
  });

  it('rejects illegal transitions and in-place mutation patterns', () => {
    const original = makeCertification();
    const archived = archiveStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: original,
      reason: 'done',
      archivedBy: 'operator-bob',
      archivedAt,
    });
    expect(() =>
      deprecateStrategyCertification({
        lifecycleRecordId: 'lc-2',
        certification: archived.certification,
        reason: 'nope',
        deprecatedBy: 'operator-bob',
        deprecatedAt,
      }),
    ).toThrow(/illegal lifecycle transition/);
  });

  it('prevents new eligibility records for deprecated certifications', () => {
    const original = makeCertification();
    const deprecated = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: original,
      reason: 'edge decay',
      deprecatedBy: 'operator-bob',
      deprecatedAt,
    });

    expect(
      evaluateStrategyEligibility({
        eligibilityId: 'elig-1',
        certification: deprecated.certification,
        rulesVersion: 'rules-v1',
        evaluatedAt: deprecatedAt,
      }).reasons,
    ).toContain('certification_deprecated');

    expect(() =>
      createStrategyEligibility({
        eligibilityId: 'elig-1',
        certification: deprecated.certification,
        rulesVersion: 'rules-v1',
        evaluatedAt: deprecatedAt,
      }),
    ).toThrow(/not eligible/);
  });

  it('does not change certification content or evidence across transitions', () => {
    const original = makeCertification();
    const evidenceBefore = original.evidence.map((e) => e.evidenceId);
    const deprecated = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: original,
      reason: 'edge decay',
      deprecatedBy: 'operator-bob',
      deprecatedAt,
    });
    expect(deprecated.certification.evidence.map((e) => e.evidenceId)).toEqual(evidenceBefore);
    expect(deprecated.certification.decision).toBe('admitted');
    expect(deprecated.lifecycleRecord.contentHash).toBe('sha256:abc');
  });
});
