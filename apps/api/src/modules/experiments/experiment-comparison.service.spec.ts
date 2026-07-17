import { beforeEach, describe, expect, it } from 'vitest';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { ExperimentComparisonService } from './experiment-comparison.service';
import { ExperimentDomainService } from './experiment-domain.service';
import { ExperimentVersionNotFoundError } from './experiment-version-not-found.error';

function sampleReport(overrides?: Partial<CampaignReport>): CampaignReport {
  return {
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 3,
    passCount: 1,
    failCount: 1,
    needsReviewCount: 1,
    bestExperimentId: 'exp-run-1',
    bestProfitFactor: 1.2,
    bestReturn: 3,
    bestExpectancy: 1,
    lowestDrawdown: 8,
    verdict: 'NEEDS_REVIEW',
    recommendations: ['Tighten fees'],
    createdAt: '2026-07-17T10:04:00.000Z',
    ...overrides,
  };
}

function sampleSession(report?: CampaignReport): CampaignSession {
  return {
    id: 'sess-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    report: report ?? sampleReport(),
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      tags: ['campaign'],
    },
  };
}

describe('ExperimentComparisonService (US078)', () => {
  let experiments: ExperimentDomainService;
  let comparison: ExperimentComparisonService;

  beforeEach(() => {
    experiments = new ExperimentDomainService();
    comparison = new ExperimentComparisonService(experiments);
  });

  it('returns empty diffs for identical versions', () => {
    const experiment = experiments.createFromSession({ session: sampleSession() });

    const result = comparison.compareVersions(experiment.experimentId, 1, 1);

    expect(result).not.toBeNull();
    expect(result!.result).toEqual({
      addedInsights: [],
      removedInsights: [],
      summaryChanged: false,
      previousSummary: result!.result.previousSummary,
      currentSummary: result!.result.currentSummary,
      addedTags: [],
      removedTags: [],
      metadataDifferences: [],
    });
    expect(result!.result.previousSummary).toBe(result!.result.currentSummary);
  });

  it('detects summary changed', () => {
    const experiment = experiments.createFromSession({ session: sampleSession() });
    experiments.createVersion(experiment.experimentId, {
      report: sampleReport({
        passCount: 0,
        failCount: 3,
        needsReviewCount: 0,
        verdict: 'FAIL',
        recommendations: ['Tighten fees'],
      }),
      sourceSessionId: 'sess-2',
    });

    const result = comparison.compareVersions(experiment.experimentId, 1, 2)!;

    expect(result.result.summaryChanged).toBe(true);
    expect(result.result.previousSummary).toContain('verdict NEEDS_REVIEW');
    expect(result.result.currentSummary).toContain('verdict FAIL');
  });

  it('detects insights added', () => {
    const experiment = experiments.createFromSession({ session: sampleSession() });
    experiments.createVersion(experiment.experimentId, {
      report: sampleReport({
        recommendations: ['Tighten fees', 'Retest longer history'],
      }),
      sourceSessionId: 'sess-2',
    });

    const result = comparison.compareVersions(experiment.experimentId, 1, 2)!;

    expect(result.result.addedInsights).toEqual(['Retest longer history']);
    expect(result.result.removedInsights).toEqual([]);
  });

  it('detects insights removed', () => {
    const experiment = experiments.createFromSession({
      session: sampleSession(
        sampleReport({ recommendations: ['Tighten fees', 'Retest longer history'] }),
      ),
    });
    experiments.createVersion(experiment.experimentId, {
      report: sampleReport({ recommendations: ['Tighten fees'] }),
      sourceSessionId: 'sess-2',
    });

    const result = comparison.compareVersions(experiment.experimentId, 1, 2)!;

    expect(result.result.removedInsights).toEqual(['Retest longer history']);
    expect(result.result.addedInsights).toEqual([]);
  });

  it('detects tags added', () => {
    const experiment = experiments.createFromSession({ session: sampleSession() });
    experiments.createVersion(experiment.experimentId, {
      report: sampleReport({ verdict: 'PASS', passCount: 3, failCount: 0, needsReviewCount: 0 }),
      sourceSessionId: 'sess-2',
    });

    const result = comparison.compareVersions(experiment.experimentId, 1, 2)!;

    expect(result.result.addedTags).toEqual(expect.arrayContaining(['pass', 'v2']));
    expect(result.result.removedTags).toEqual(expect.arrayContaining(['needs_review', 'v1']));
  });

  it('detects tags removed', () => {
    const experiment = experiments.createFromSession({
      session: sampleSession(sampleReport({ sliceIdentity: 'slice-a' })),
    });
    experiments.createVersion(experiment.experimentId, {
      report: sampleReport(),
      sourceSessionId: 'sess-2',
    });

    const result = comparison.compareVersions(experiment.experimentId, 1, 2)!;

    expect(result.result.removedTags).toContain('slice:slice-a');
  });

  it('detects metadata changed', () => {
    const experiment = experiments.createFromSession({
      session: sampleSession(),
      metadata: { engineVersion: '1.0.3', datasetId: 'ds-1', strategyId: 'donchian-breakout' },
    });
    experiments.createVersion(experiment.experimentId, {
      report: sampleReport({ datasetId: 'ds-2', strategyId: 'ema-crossover' }),
      sourceSessionId: 'sess-2',
    });

    const result = comparison.compareVersions(experiment.experimentId, 1, 2)!;

    expect(result.result.metadataDifferences).toEqual(
      expect.arrayContaining([
        { key: 'datasetId', before: 'ds-1', after: 'ds-2' },
        { key: 'strategyId', before: 'donchian-breakout', after: 'ema-crossover' },
      ]),
    );
  });

  it('compares different experiments by current version', () => {
    const a = experiments.createFromSession({
      session: { ...sampleSession(), id: 'sess-a' },
    });
    const b = experiments.createFromSession({
      session: {
        ...sampleSession(
          sampleReport({
            verdict: 'FAIL',
            passCount: 0,
            failCount: 3,
            needsReviewCount: 0,
            recommendations: ['Stop'],
          }),
        ),
        id: 'sess-b',
      },
    });

    const result = comparison.compareExperiments(a, b);

    expect(result.leftExperimentId).toBe(a.experimentId);
    expect(result.rightExperimentId).toBe(b.experimentId);
    expect(result.leftVersion).toBe(1);
    expect(result.rightVersion).toBe(1);
    expect(result.result.summaryChanged).toBe(true);
    expect(result.result.addedInsights).toContain('Stop');
    expect(result.result.removedInsights).toContain('Tighten fees');
  });

  it('throws when version is invalid', () => {
    const experiment = experiments.createFromSession({ session: sampleSession() });

    expect(() => comparison.compareVersions(experiment.experimentId, 1, 99)).toThrow(
      ExperimentVersionNotFoundError,
    );
  });

  it('returns null when experiment is not found', () => {
    expect(comparison.compareVersions('missing', 1, 2)).toBeNull();
  });
});
