import { describe, expect, it } from 'vitest';
import type { CrossCampaignFinding } from '../../../cross-campaign-analysis/cross-campaign-finding';
import { createInsightDomainService } from '../../../insight/insight-domain.test-utils';
import { InsightGenerationService } from '../../../insight/insight-generation.service';
import { InsightSource } from '../../../insight/insight-source';
import { InsightType } from '../../../insight/insight-type';
import type { PipelineContext } from '../../pipeline-context';
import { readCrossAnalysisResult } from './cross-analysis-pipeline-context';
import { PersistCrossAnalysisStep } from './persist-cross-analysis.step';

const finding: CrossCampaignFinding = {
  kind: 'conflicting_conclusion',
  title: 'Verdicts diverge',
  summary: 'FAIL vs PASS',
  confidence: 0.7,
  campaignIds: ['c1', 'c2'],
  knowledgeEntryIds: ['k-1'],
  experimentIds: ['exp-9', 'exp-2'],
};

describe('PersistCrossAnalysisStep mapping', () => {
  it('maps cross-campaign findings independently of knowledge extraction', () => {
    const generation = new InsightGenerationService();
    const mapped = [
      ['repeated_finding', InsightType.PATTERN],
      ['recurring_pattern', InsightType.PATTERN],
      ['conflicting_conclusion', InsightType.ANOMALY],
      ['stable_trend', InsightType.TREND],
      ['unique_observation', InsightType.OBSERVATION],
    ] as const;

    for (const [kind, type] of mapped) {
      expect(generation.toInsightInput({ ...finding, kind }).type).toBe(type);
    }

    expect(generation.toInsightInput(finding)).toEqual({
      campaignSessionId: 'c1',
      experimentId: 'exp-9',
      knowledgeEntryIds: ['k-1'],
      type: InsightType.ANOMALY,
      title: 'Verdicts diverge',
      summary: 'FAIL vs PASS',
      confidence: 0.7,
      sources: [InsightSource.Campaign, InsightSource.Knowledge],
      metadata: {
        model: 'cross-campaign-deterministic',
        promptVersion: 'cross-analysis-1.0.0',
      },
    });
  });

  it('persists the mapped draft and keeps cross-analysis result statistics', async () => {
    const { service } = createInsightDomainService();
    const generation = new InsightGenerationService();
    const step = new PersistCrossAnalysisStep(service, generation);
    const context: PipelineContext = {
      input: { workspaceId: 'ws-map' },
      output: {},
      variables: {
        crossAnalysisPrepared: {
          sessions: [],
          knowledgeEntries: [],
          insights: [],
          experimentIds: ['exp-9', 'exp-2'],
          comparedCampaignIds: ['c1', 'c2'],
        },
        crossAnalysisFindings: [finding],
      },
      metadata: {},
    };

    const result = await step.execute(context);
    const payload = readCrossAnalysisResult(result);
    const draft = generation.toInsightInput(finding);

    expect(payload.generatedInsightIds).toHaveLength(1);
    expect(payload.findings).toEqual([finding]);
    expect(payload.comparedCampaignIds).toEqual(['c1', 'c2']);
    expect(payload.statistics).toEqual({
      campaignCount: 0,
      experimentCount: 2,
      knowledgeEntryCount: 0,
      insightCount: 0,
      findingCount: 1,
    });

    const saved = service.getById(payload.generatedInsightIds[0]!, 'ws-map');
    expect(saved).toMatchObject({
      workspaceId: 'ws-map',
      campaignSessionId: draft.campaignSessionId,
      experimentId: draft.experimentId,
      knowledgeEntryIds: draft.knowledgeEntryIds,
      type: draft.type,
      title: draft.title,
      summary: draft.summary,
      confidence: draft.confidence,
      sources: draft.sources,
      metadata: draft.metadata,
    });
  });
});
