import { beforeEach, describe, expect, it } from 'vitest';
import type { Experiment } from '../experiments/experiment';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { createKnowledgeDomainService } from './knowledge-domain.test-utils';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeExtractionService } from './knowledge-extraction.service';

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
    recommendations: ['Tighten fees', 'Retest on longer history'],
    createdAt: '2026-07-17T10:04:00.000Z',
    ...overrides,
  };
}

function sampleExperiment(overrides?: Partial<Experiment>): Experiment {
  const report = overrides?.versions?.[0]?.report ?? sampleReport();
  return {
    experimentId: overrides?.experimentId ?? 'exp-domain-1',
    sessionId: overrides?.sessionId ?? 'sess-1',
    createdAt: overrides?.createdAt ?? '2026-07-17T10:00:00.000Z',
    currentVersion: overrides?.currentVersion ?? 1,
    versions: overrides?.versions ?? [
      {
        version: 1,
        report,
        createdAt: '2026-07-17T10:04:00.000Z',
        sourceSessionId: 'sess-1',
      },
    ],
    metadata: overrides?.metadata ?? {
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
    },
  };
}

describe('KnowledgeExtractionService (US077 / US090)', () => {
  let extraction: KnowledgeExtractionService;
  let knowledge: KnowledgeDomainService;

  beforeEach(() => {
    ({ service: knowledge, extraction } = createKnowledgeDomainService());
  });

  it('extracts new knowledge from current version report', async () => {
    const experiment = sampleExperiment();
    const entry = await knowledge.createFromExperiment(experiment);

    expect(entry.experimentId).toBe('exp-domain-1');
    expect(entry.knowledgeId.length).toBeGreaterThan(0);
    expect(entry.title).toBe('donchian-breakout on ds-1: NEEDS_REVIEW');
    expect(entry.createdAt).toBe('2026-07-17T10:04:00.000Z');
    expect(knowledge.list()).toHaveLength(1);
  });

  it('updates existing knowledge instead of duplicating', async () => {
    const experiment = sampleExperiment();
    const first = await knowledge.createFromExperiment(experiment);

    const v2Report = sampleReport({
      verdict: 'FAIL',
      passCount: 0,
      failCount: 3,
      needsReviewCount: 0,
      recommendations: ['Abandon config'],
      bestProfitFactor: 0.8,
      createdAt: '2026-07-17T11:00:00.000Z',
    });

    const updatedExperiment = sampleExperiment({
      currentVersion: 2,
      versions: [
        experiment.versions[0],
        {
          version: 2,
          report: v2Report,
          createdAt: '2026-07-17T11:00:00.000Z',
          sourceSessionId: 'sess-2',
          replayId: 'replay-1',
        },
      ],
    });

    const second = await knowledge.createFromExperiment(updatedExperiment);

    expect(second.knowledgeId).toBe(first.knowledgeId);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.title).toBe('donchian-breakout on ds-1: FAIL');
    expect(second.summary).toContain('verdict FAIL');
    expect(knowledge.list()).toHaveLength(1);
    expect(knowledge.getByExperimentId('exp-domain-1')?.knowledgeId).toBe(first.knowledgeId);
  });

  it('is deterministic for the same experiment version', () => {
    const experiment = sampleExperiment();
    const a = extraction.extract(experiment);
    const b = extraction.extract(experiment);

    expect(a).toEqual(b);
    expect(a.title).toBe(b.title);
    expect(a.summary).toBe(b.summary);
    expect(a.tags).toEqual(b.tags);
    expect(a.insights).toEqual(b.insights);
    expect(a.metadata).toEqual(b.metadata);
    expect(a.createdAt).toBe(b.createdAt);
  });

  it('prevents duplicates via createFromExperiment', async () => {
    const experiment = sampleExperiment();
    await knowledge.createFromExperiment(experiment);
    await knowledge.createFromExperiment(experiment);
    await knowledge.createFromExperiment(experiment);

    expect(knowledge.list()).toHaveLength(1);
  });

  it('maps tags from strategy, dataset, verdict, and version', () => {
    const extracted = extraction.extract(sampleExperiment({ currentVersion: 1 }));

    expect(extracted.tags).toEqual(['donchian-breakout', 'ds-1', 'needs_review', 'v1']);
  });

  it('maps metadata from report and experiment', () => {
    const extracted = extraction.extract(sampleExperiment());

    expect(extracted.metadata).toEqual({
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      source: 'extraction',
      engineVersion: '1.0.3',
    });
  });

  it('maps summary from run counts and verdict', () => {
    const extracted = extraction.extract(sampleExperiment());

    expect(extracted.summary).toBe(
      '1 pass / 1 fail / 1 needs_review; across 3 runs; verdict NEEDS_REVIEW',
    );
  });

  it('maps insights from recommendations and key metrics', () => {
    const extracted = extraction.extract(sampleExperiment());

    expect(extracted.insights).toEqual([
      'Tighten fees',
      'Retest on longer history',
      'Best profit factor: 1.2',
      'Best return: 3',
      'Lowest drawdown: 8',
    ]);
  });
});
