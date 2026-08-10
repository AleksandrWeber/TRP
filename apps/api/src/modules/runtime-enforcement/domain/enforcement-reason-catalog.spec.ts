/**
 * RC-23 Epic 6 — full Enforcement reason-code catalog coverage.
 * Verification only: exercises existing validateDeployment paths.
 */

import { describe, expect, it } from 'vitest';
import { createStrategy } from '../../strategy-library/domain/strategy';
import {
  createStrategyCertification,
  type StrategyCertification,
} from '../../strategy-library/domain/strategy-certification';
import {
  createStrategyEligibility,
  evaluateStrategyEligibility,
} from '../../strategy-library/domain/strategy-eligibility';
import {
  archiveStrategyCertification,
  deprecateStrategyCertification,
} from '../../strategy-library/domain/strategy-lifecycle';
import { createStrategyVersion } from '../../strategy-library/domain/strategy-version';
import type { StrategyVersionRecord } from '../../strategy-library/ports/strategy-library-lookup.port';
import type { EnforcementReasonCode } from '../ports/runtime-enforcement.port';
import { validateDeployment, type ValidateDeploymentLibraryReads } from './validate-deployment';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';
const checkedAt = '2026-08-10T16:00:00.000Z';

const CATALOG: readonly EnforcementReasonCode[] = Object.freeze([
  'strategy_not_found',
  'strategy_version_not_found',
  'identity_ambiguous',
  'certification_missing',
  'certification_not_admitted',
  'certification_not_active',
  'certification_deprecated',
  'certification_archived',
  'eligibility_missing',
  'eligibility_ineligible',
  'envelope_missing',
  'envelope_not_immutable',
  'scope_not_allowed',
  'envelope_violation',
  'workspace_mismatch',
]);

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

function makeActiveCertification(version = makeVersion()) {
  return createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt,
    evidence: requiredEvidence(),
    tacticalEnvelope: requiredEnvelope(),
  });
}

function toRecord(input: {
  certification?: StrategyCertification | null;
  eligibility?: ReturnType<typeof createStrategyEligibility> | null;
  tacticalEnvelope?: StrategyVersionRecord['tacticalEnvelope'];
  workspaceId?: string;
}): StrategyVersionRecord {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId: input.workspaceId ?? 'ws-1',
    createdAt,
  });
  const version =
    input.workspaceId && input.workspaceId !== 'ws-1'
      ? createStrategyVersion({
          libraryEntryId: 'lib-entry-1',
          strategyFamilyId: 'fam-momentum',
          version: '1.0.0',
          contentHash: 'sha256:abc',
          market: 'crypto-spot',
          supportedExchangeScopeIds: ['binance-spot'],
          supportedTimeframes: ['1h', '4h'],
          supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
          workspaceId: input.workspaceId,
          createdAt,
        })
      : makeVersion();
  const certification =
    input.certification === undefined ? makeActiveCertification(version) : input.certification;
  return Object.freeze({
    authorityClass: 'source_of_truth',
    strategy,
    version,
    certification,
    eligibility: input.eligibility === undefined ? null : input.eligibility,
    tacticalEnvelope:
      input.tacticalEnvelope === undefined
        ? (certification?.tacticalEnvelope ?? null)
        : input.tacticalEnvelope,
    membershipStatus: certification
      ? certification.status === 'active'
        ? 'certified'
        : certification.status
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

function cmd(overrides: Record<string, unknown> = {}) {
  return {
    workspaceId: 'ws-1',
    libraryEntryId: 'lib-entry-1',
    purpose: 'deployment_bind' as const,
    requestedAt: checkedAt,
    ...overrides,
  };
}

describe('RC-23 Epic 6 — Enforcement reason catalog coverage', () => {
  it('locks the contract catalog membership', () => {
    expect(CATALOG).toHaveLength(15);
  });

  it('covers strategy_not_found', () => {
    expect(
      validateDeployment(
        cmd({ libraryEntryId: undefined, strategyFamilyId: 'missing', strategyVersion: '1.0.0' }),
        makeReads([]),
      ).reasons,
    ).toEqual(['strategy_not_found']);
  });

  it('covers strategy_version_not_found', () => {
    const record = toRecord({
      eligibility: createStrategyEligibility({
        eligibilityId: 'elig-1',
        certification: makeActiveCertification(),
        rulesVersion: 'rules-v1',
        evaluatedAt,
      }),
    });
    expect(
      validateDeployment(
        cmd({
          libraryEntryId: undefined,
          strategyFamilyId: 'fam-momentum',
          strategyVersion: '9.9.9',
        }),
        makeReads([record]),
      ).reasons,
    ).toEqual(['strategy_version_not_found']);
  });

  it('covers identity_ambiguous', () => {
    expect(validateDeployment(cmd({ libraryEntryId: undefined }), makeReads([])).reasons).toEqual([
      'identity_ambiguous',
    ]);
  });

  it('covers certification_missing', () => {
    expect(
      validateDeployment(cmd(), makeReads([toRecord({ certification: null, eligibility: null })]))
        .reasons,
    ).toEqual(['certification_missing']);
  });

  it('covers certification_not_admitted', () => {
    const base = makeActiveCertification();
    const notAdmitted = Object.freeze({
      ...base,
      decision: 'pending' as unknown as 'admitted',
    });
    expect(
      validateDeployment(
        cmd(),
        makeReads([toRecord({ certification: notAdmitted, eligibility: null })]),
      ).reasons,
    ).toEqual(['certification_not_admitted']);
  });

  it('covers certification_not_active', () => {
    const base = makeActiveCertification();
    const notActive = Object.freeze({
      ...base,
      status: 'pending' as unknown as 'active',
    });
    expect(
      validateDeployment(
        cmd(),
        makeReads([toRecord({ certification: notActive, eligibility: null })]),
      ).reasons,
    ).toEqual(['certification_not_active']);
  });

  it('covers certification_deprecated', () => {
    const { certification } = deprecateStrategyCertification({
      lifecycleRecordId: 'lc-1',
      certification: makeActiveCertification(),
      reason: 'done',
      deprecatedBy: 'operator-alice',
      deprecatedAt: '2026-08-10T15:00:00.000Z',
    });
    expect(
      validateDeployment(cmd(), makeReads([toRecord({ certification, eligibility: null })]))
        .reasons,
    ).toEqual(['certification_deprecated']);
  });

  it('covers certification_archived', () => {
    const { certification } = archiveStrategyCertification({
      lifecycleRecordId: 'lc-2',
      certification: makeActiveCertification(),
      reason: 'done',
      archivedBy: 'operator-alice',
      archivedAt: '2026-08-10T15:00:00.000Z',
    });
    expect(
      validateDeployment(cmd(), makeReads([toRecord({ certification, eligibility: null })]))
        .reasons,
    ).toEqual(['certification_archived']);
  });

  it('covers eligibility_missing', () => {
    expect(validateDeployment(cmd(), makeReads([toRecord({ eligibility: null })])).reasons).toEqual(
      ['eligibility_missing'],
    );
  });

  it('covers eligibility_ineligible', () => {
    const certification = makeActiveCertification();
    const ineligible = evaluateStrategyEligibility({
      eligibilityId: 'elig-bad',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
      tacticPoint: { symbol: 'BADUSDT' },
    });
    expect(ineligible.outcome).toBe('ineligible');
    expect(
      validateDeployment(cmd(), makeReads([toRecord({ certification, eligibility: ineligible })]))
        .reasons,
    ).toEqual(['eligibility_ineligible']);
  });

  it('covers envelope_missing', () => {
    const certification = Object.freeze({
      ...makeActiveCertification(),
      tacticalEnvelope: null as unknown as ReturnType<
        typeof makeActiveCertification
      >['tacticalEnvelope'],
    });
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification: makeActiveCertification(),
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(
      validateDeployment(
        cmd(),
        makeReads([toRecord({ certification, eligibility, tacticalEnvelope: null })]),
      ).reasons,
    ).toEqual(['envelope_missing']);
  });

  it('covers envelope_not_immutable', () => {
    const certification = makeActiveCertification();
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    const mutableEnvelope = {
      ...certification.tacticalEnvelope,
      allowedSymbols: [...certification.tacticalEnvelope.allowedSymbols],
    };
    expect(
      validateDeployment(
        cmd(),
        makeReads([
          toRecord({
            certification: Object.freeze({
              ...certification,
              tacticalEnvelope: mutableEnvelope as never,
            }),
            eligibility,
            tacticalEnvelope: mutableEnvelope as never,
          }),
        ]),
      ).reasons,
    ).toEqual(['envelope_not_immutable']);
  });

  it('covers scope_not_allowed', () => {
    const certification = makeActiveCertification();
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(
      validateDeployment(
        cmd({ exchangeScopeId: 'kraken-spot' }),
        makeReads([toRecord({ certification, eligibility })]),
      ).reasons,
    ).toEqual(['scope_not_allowed']);
  });

  it('covers envelope_violation', () => {
    const certification = makeActiveCertification();
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(
      validateDeployment(
        cmd({ tacticPoint: { symbol: 'DOGEUSDT' } }),
        makeReads([toRecord({ certification, eligibility })]),
      ).reasons,
    ).toEqual(['envelope_violation']);
  });

  it('covers workspace_mismatch', () => {
    const certification = makeActiveCertification();
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    expect(
      validateDeployment(
        cmd({ workspaceId: 'ws-other' }),
        makeReads([toRecord({ certification, eligibility, workspaceId: 'ws-1' })]),
      ).reasons,
    ).toEqual(['workspace_mismatch']);
  });

  it('maps every catalog code to at least one deterministic INVALID path', () => {
    const seen = new Set<EnforcementReasonCode>();
    const cases: Array<() => EnforcementReasonCode> = [
      () =>
        validateDeployment(
          cmd({ libraryEntryId: undefined, strategyFamilyId: 'x', strategyVersion: '1' }),
          makeReads([]),
        ).reasons[0]!,
      () =>
        validateDeployment(
          cmd({
            libraryEntryId: undefined,
            strategyFamilyId: 'fam-momentum',
            strategyVersion: '2',
          }),
          makeReads([
            toRecord({
              eligibility: createStrategyEligibility({
                eligibilityId: 'e',
                certification: makeActiveCertification(),
                rulesVersion: 'r',
                evaluatedAt,
              }),
            }),
          ]),
        ).reasons[0]!,
      () => validateDeployment(cmd({ libraryEntryId: undefined }), makeReads([])).reasons[0]!,
      () =>
        validateDeployment(cmd(), makeReads([toRecord({ certification: null, eligibility: null })]))
          .reasons[0]!,
      () =>
        validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification: Object.freeze({
                ...makeActiveCertification(),
                decision: 'pending' as never,
              }),
              eligibility: null,
            }),
          ]),
        ).reasons[0]!,
      () =>
        validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification: Object.freeze({
                ...makeActiveCertification(),
                status: 'pending' as never,
              }),
              eligibility: null,
            }),
          ]),
        ).reasons[0]!,
      () =>
        validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification: deprecateStrategyCertification({
                lifecycleRecordId: 'lc',
                certification: makeActiveCertification(),
                reason: 'r',
                deprecatedBy: 'a',
                deprecatedAt: '2026-08-10T15:00:00.000Z',
              }).certification,
              eligibility: null,
            }),
          ]),
        ).reasons[0]!,
      () =>
        validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification: archiveStrategyCertification({
                lifecycleRecordId: 'lc',
                certification: makeActiveCertification(),
                reason: 'r',
                archivedBy: 'a',
                archivedAt: '2026-08-10T15:00:00.000Z',
              }).certification,
              eligibility: null,
            }),
          ]),
        ).reasons[0]!,
      () => validateDeployment(cmd(), makeReads([toRecord({ eligibility: null })])).reasons[0]!,
      () => {
        const certification = makeActiveCertification();
        return validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification,
              eligibility: evaluateStrategyEligibility({
                eligibilityId: 'bad',
                certification,
                rulesVersion: 'r',
                evaluatedAt,
                tacticPoint: { symbol: 'ZZZ' },
              }),
            }),
          ]),
        ).reasons[0]!;
      },
      () =>
        validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification: Object.freeze({
                ...makeActiveCertification(),
                tacticalEnvelope: null as never,
              }),
              eligibility: createStrategyEligibility({
                eligibilityId: 'e',
                certification: makeActiveCertification(),
                rulesVersion: 'r',
                evaluatedAt,
              }),
              tacticalEnvelope: null,
            }),
          ]),
        ).reasons[0]!,
      () => {
        const certification = makeActiveCertification();
        const mutable = { ...certification.tacticalEnvelope };
        return validateDeployment(
          cmd(),
          makeReads([
            toRecord({
              certification: Object.freeze({
                ...certification,
                tacticalEnvelope: mutable as never,
              }),
              eligibility: createStrategyEligibility({
                eligibilityId: 'e',
                certification,
                rulesVersion: 'r',
                evaluatedAt,
              }),
              tacticalEnvelope: mutable as never,
            }),
          ]),
        ).reasons[0]!;
      },
      () => {
        const certification = makeActiveCertification();
        return validateDeployment(
          cmd({ exchangeScopeId: 'kraken-spot' }),
          makeReads([
            toRecord({
              certification,
              eligibility: createStrategyEligibility({
                eligibilityId: 'e',
                certification,
                rulesVersion: 'r',
                evaluatedAt,
              }),
            }),
          ]),
        ).reasons[0]!;
      },
      () => {
        const certification = makeActiveCertification();
        return validateDeployment(
          cmd({ tacticPoint: { symbol: 'DOGEUSDT' } }),
          makeReads([
            toRecord({
              certification,
              eligibility: createStrategyEligibility({
                eligibilityId: 'e',
                certification,
                rulesVersion: 'r',
                evaluatedAt,
              }),
            }),
          ]),
        ).reasons[0]!;
      },
      () => {
        const certification = makeActiveCertification();
        return validateDeployment(
          cmd({ workspaceId: 'ws-other' }),
          makeReads([
            toRecord({
              certification,
              eligibility: createStrategyEligibility({
                eligibilityId: 'e',
                certification,
                rulesVersion: 'r',
                evaluatedAt,
              }),
            }),
          ]),
        ).reasons[0]!;
      },
    ];

    for (const run of cases) {
      seen.add(run());
    }
    expect([...seen].sort()).toEqual([...CATALOG].sort());
  });
});
