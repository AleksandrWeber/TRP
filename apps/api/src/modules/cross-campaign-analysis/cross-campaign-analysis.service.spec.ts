import { beforeEach, describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { createInsightDomainService } from '../insight/insight-domain.test-utils';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineHookRegistry } from '../pipeline/pipeline-hook-registry';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../pipeline/builtin-pipeline-templates';
import { registerCrossAnalysisPipelineSteps } from '../pipeline/steps/cross-analysis/register-cross-analysis-steps';
import { registerInsightPipelineSteps } from '../pipeline/steps/insight/register-insight-steps';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { CrossCampaignAnalysisService } from './cross-campaign-analysis.service';

function sampleReport(overrides?: Partial<CampaignReport>): CampaignReport {
  return {
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 2,
    passCount: 0,
    failCount: 2,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 0.8,
    bestReturn: -1,
    bestExpectancy: -0.5,
    lowestDrawdown: 20,
    verdict: 'FAIL',
    recommendations: [],
    createdAt: '2026-07-17T10:00:00.000Z',
    ...overrides,
  };
}

function sampleSession(id: string, reportOverrides?: Partial<CampaignReport>): CampaignSession {
  return {
    id,
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: { datasetId: 'ds-1' },
    report: sampleReport({ campaignId: id, ...reportOverrides }),
  };
}

function sampleKnowledge(overrides?: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    knowledgeId: overrides?.knowledgeId ?? 'k-1',
    experimentId: overrides?.experimentId ?? 'exp-1',
    createdAt: '2026-07-17T10:00:00.000Z',
    title: overrides?.title ?? 'Shared finding',
    summary: 's',
    tags: ['fail'],
    insights: [],
    metadata: {
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
    },
  };
}

function createAnalysisService() {
  const registry = new PipelineRegistry();
  const pipelines = new PipelineDomainService();
  const templates = new PipelineTemplateService(pipelines);
  const executor = new PipelineExecutor(registry, new PipelineHookRegistry());
  const { service: insights } = createInsightDomainService();

  // Re-register insight steps onto shared registry is unnecessary for cross-analysis;
  // cross-analysis only needs InsightDomainService.create.
  registerInsightPipelineSteps(registry, { insights });
  registerCrossAnalysisPipelineSteps(registry, { insights });

  const service = new CrossCampaignAnalysisService(executor, templates, pipelines);
  return { service, insights, templates };
}

describe('CrossCampaignAnalysisService (US097)', () => {
  let service: CrossCampaignAnalysisService;
  let insights: ReturnType<typeof createInsightDomainService>['service'];
  let templates: PipelineTemplateService;

  beforeEach(() => {
    ({ service, insights, templates } = createAnalysisService());
  });

  it('registers built-in cross-campaign analysis template', () => {
    const template = templates.getTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.crossCampaignAnalysis);
    expect(template).not.toBeNull();
    expect(template!.name).toBe('Cross-Campaign Analysis Pipeline');
  });

  it('analyzes campaigns and persists generated insights', async () => {
    const result = await service.analyze({
      sessions: [
        sampleSession('c1', { verdict: 'FAIL' }),
        sampleSession('c2', { verdict: 'FAIL', bestExperimentId: 'exp-2' }),
      ],
      knowledgeEntries: [
        sampleKnowledge({ knowledgeId: 'k-1', title: 'Fee erosion' }),
        sampleKnowledge({ knowledgeId: 'k-2', title: 'Fee erosion', experimentId: 'exp-2' }),
      ],
      insights: [],
    });

    expect(result.comparedCampaignIds).toEqual(['c1', 'c2']);
    expect(result.id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(result.createdAt))).toBe(false);
    expect(service.getById(result.id)).toEqual(result);
    expect(service.search({ campaignSessionId: 'c1' })).toHaveLength(1);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.statistics.campaignCount).toBe(2);
    expect(result.statistics.knowledgeEntryCount).toBe(2);
    expect(result.statistics.findingCount).toBe(result.findings.length);
    expect(result.generatedInsightIds).toHaveLength(result.findings.length);

    for (const id of result.generatedInsightIds) {
      expect(insights.getById(id)).not.toBeNull();
    }

    expect(
      result.findings.some((f) => f.kind === 'stable_trend' || f.kind === 'repeated_finding'),
    ).toBe(true);
  });

  it('returns conflicting conclusions when verdicts diverge', async () => {
    const result = await service.analyze({
      sessions: [
        sampleSession('c1', { verdict: 'FAIL' }),
        sampleSession('c2', { verdict: 'PASS', bestExperimentId: 'exp-2' }),
      ],
      knowledgeEntries: [],
      insights: [],
    });

    expect(result.findings.some((f) => f.kind === 'conflicting_conclusion')).toBe(true);
    expect(result.generatedInsightIds.length).toBe(result.findings.length);
  });
});
