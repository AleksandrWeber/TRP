import { beforeEach, describe, expect, it } from 'vitest';
import type { KnowledgeEntry } from '../../../knowledge/knowledge-entry';
import { createInsightDomainService } from '../../../insight/insight-domain.test-utils';
import { InsightType } from '../../../insight/insight-type';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../../builtin-pipeline-templates';
import type { PipelineContext } from '../../pipeline-context';
import { PipelineRunStatus } from '../../pipeline-run-status';
import { ExtractInsightsStep } from './extract-insights.step';
import { extractInsightDrafts } from './insight-extraction.rules';
import { readPersistedInsights, type InsightExtractionContext } from './insight-pipeline-context';
import { INSIGHT_PIPELINE_STEP_METADATA, INSIGHT_PIPELINE_STEPS } from './insight-step-metadata';
import { PersistInsightsStep } from './persist-insights.step';
import { PrepareInsightExtractionStep } from './prepare-insight-extraction.step';

function sampleKnowledge(overrides?: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    knowledgeId: overrides?.knowledgeId ?? 'k-1',
    workspaceId: overrides?.workspaceId ?? 'default',
    experimentId: overrides?.experimentId ?? 'exp-1',
    createdAt: '2026-07-17T10:00:00.000Z',
    title: overrides?.title ?? 'Donchian note',
    summary: overrides?.summary ?? 'Channel failed on fees',
    tags: overrides?.tags ?? ['donchian-breakout', 'ds-1', 'fail', 'v1'],
    insights: overrides?.insights ?? ['Fees erase edge'],
    metadata: overrides?.metadata ?? {
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      source: 'extraction',
    },
  };
}

describe('Insight Pipeline Steps (US096)', () => {
  it('defines prepare → extract → persist metadata order', () => {
    expect(INSIGHT_PIPELINE_STEPS.map((s) => s.stepId)).toEqual([
      'insights.prepare',
      'insights.extract',
      'insights.persist',
    ]);
    expect(INSIGHT_PIPELINE_STEP_METADATA.prepare.order).toBe(1);
    expect(INSIGHT_PIPELINE_STEP_METADATA.extract.order).toBe(2);
    expect(INSIGHT_PIPELINE_STEP_METADATA.persist.order).toBe(3);
  });

  it('registers step classes with matching metadata', () => {
    const { service } = createInsightDomainService();
    expect(new PrepareInsightExtractionStep().getMetadata().stepId).toBe('insights.prepare');
    expect(new ExtractInsightsStep().getMetadata().stepId).toBe('insights.extract');
    expect(new PersistInsightsStep(service).getMetadata().stepId).toBe('insights.persist');
  });

  it('extracts deterministic drafts for consistent fail trend', () => {
    const extraction: InsightExtractionContext = {
      campaignSessionId: 'sess-1',
      experimentIds: ['exp-1', 'exp-2'],
      knowledgeEntryIds: ['k-1', 'k-2'],
      knowledgeEntries: [
        sampleKnowledge({ knowledgeId: 'k-1', experimentId: 'exp-1' }),
        sampleKnowledge({
          knowledgeId: 'k-2',
          experimentId: 'exp-2',
          title: 'Other note',
          tags: ['ema-crossover', 'ds-1', 'fail', 'v1'],
        }),
      ],
    };

    const drafts = extractInsightDrafts(extraction);
    expect(drafts.some((d) => d.type === InsightType.SUMMARY)).toBe(true);
    expect(drafts.some((d) => d.type === InsightType.TREND)).toBe(true);
    expect(drafts.every((d) => d.metadata?.model === 'deterministic-rules')).toBe(true);
  });

  it('detects anomaly when verdicts conflict', () => {
    const drafts = extractInsightDrafts({
      experimentIds: ['exp-1'],
      knowledgeEntryIds: ['k-1', 'k-2'],
      knowledgeEntries: [
        sampleKnowledge({ knowledgeId: 'k-1', tags: ['a', 'fail'] }),
        sampleKnowledge({
          knowledgeId: 'k-2',
          title: 'Pass note',
          tags: ['b', 'pass'],
        }),
      ],
    });

    expect(drafts.some((d) => d.type === InsightType.ANOMALY)).toBe(true);
  });

  describe('pipeline execution', () => {
    let wired: ReturnType<typeof createInsightDomainService>;

    beforeEach(() => {
      wired = createInsightDomainService();
    });

    it('executes Insight template and persists insights', async () => {
      const knowledgeEntries = [
        sampleKnowledge({ knowledgeId: 'k-1' }),
        sampleKnowledge({
          knowledgeId: 'k-2',
          title: 'Donchian note',
          tags: ['donchian-breakout', 'fail'],
        }),
      ];

      const pipeline = wired.templates.createPipelineFromTemplate(
        BUILTIN_PIPELINE_TEMPLATE_IDS.insight,
      )!;
      const run = wired.pipelines.createRun({ pipelineId: pipeline.pipelineId })!;

      const context: PipelineContext = {
        input: {
          campaignSessionId: 'sess-1',
          experimentIds: ['exp-1'],
          knowledgeEntries,
        },
        output: {},
        variables: {},
        metadata: {},
      };

      const result = await wired.executor.execute(pipeline, context, run);

      expect(result.success).toBe(true);
      expect(run.status).toBe(PipelineRunStatus.COMPLETED);
      expect(pipeline.steps.map((s) => s.stepId)).toEqual([
        'insights.prepare',
        'insights.extract',
        'insights.persist',
      ]);

      const insights = readPersistedInsights(result.context);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.every((i) => i.id.length > 0)).toBe(true);
      expect(wired.service.search({ campaignSessionId: 'sess-1' }).length).toBe(insights.length);
    });

    it('matches extractFromKnowledge orchestrator output shape', async () => {
      const knowledgeEntries = [sampleKnowledge()];
      const viaOrchestrator = await wired.service.extractFromKnowledge({
        campaignSessionId: 'sess-orch',
        knowledgeEntries,
      });

      expect(viaOrchestrator.length).toBeGreaterThan(0);
      expect(viaOrchestrator[0]?.knowledgeEntryIds).toContain('k-1');
      expect(viaOrchestrator.every((i) => i.metadata.model === 'deterministic-rules')).toBe(true);
    });
  });
});
