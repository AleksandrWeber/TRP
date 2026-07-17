import { beforeEach, describe, expect, it } from 'vitest';
import type { Experiment } from '../../../experiments/experiment';
import { createKnowledgeDomainService } from '../../../knowledge/knowledge-domain.test-utils';
import type { CampaignReport } from '../../../research-campaign/campaign-report.types';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../../builtin-pipeline-templates';
import type { PipelineContext } from '../../pipeline-context';
import { PipelineRunStatus } from '../../pipeline-run-status';
import { DEFAULT_WORKSPACE_ID } from '../../workspace-context';
import { ExtractKnowledgeStep } from './extract-knowledge.step';
import { readKnowledgeEntry } from './knowledge-pipeline-context';
import {
  KNOWLEDGE_PIPELINE_STEP_METADATA,
  KNOWLEDGE_PIPELINE_STEPS,
} from './knowledge-step-metadata';
import { PrepareKnowledgeExtractionStep } from './prepare-knowledge-extraction.step';
import { UpsertKnowledgeEntryStep } from './upsert-knowledge-entry.step';

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

function sampleExperiment(): Experiment {
  const report = sampleReport();
  return {
    experimentId: 'exp-pipeline-1',
    sessionId: 'sess-1',
    createdAt: '2026-07-17T10:00:00.000Z',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        report,
        createdAt: '2026-07-17T10:04:00.000Z',
        sourceSessionId: 'sess-1',
      },
    ],
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
    },
  };
}

describe('Knowledge Pipeline Steps (US090)', () => {
  it('defines prepare → extract → upsert metadata order', () => {
    expect(KNOWLEDGE_PIPELINE_STEPS.map((s) => s.stepId)).toEqual([
      'knowledge.prepare',
      'knowledge.extract',
      'knowledge.upsert',
    ]);
    expect(KNOWLEDGE_PIPELINE_STEP_METADATA.prepare.order).toBe(1);
    expect(KNOWLEDGE_PIPELINE_STEP_METADATA.extract.order).toBe(2);
    expect(KNOWLEDGE_PIPELINE_STEP_METADATA.upsert.order).toBe(3);
  });

  it('registers step classes with matching metadata', () => {
    const { extraction, service } = createKnowledgeDomainService();
    expect(new PrepareKnowledgeExtractionStep().getMetadata().stepId).toBe('knowledge.prepare');
    expect(new ExtractKnowledgeStep(extraction).getMetadata().stepId).toBe('knowledge.extract');
    expect(new UpsertKnowledgeEntryStep(service).getMetadata().stepId).toBe('knowledge.upsert');
  });

  describe('pipeline execution', () => {
    let wired: ReturnType<typeof createKnowledgeDomainService>;

    beforeEach(() => {
      wired = createKnowledgeDomainService();
    });

    it('executes in metadata order and upserts KnowledgeEntry', async () => {
      const experiment = sampleExperiment();
      const pipeline = wired.templates.createPipelineFromTemplate(
        BUILTIN_PIPELINE_TEMPLATE_IDS.knowledge,
      )!;
      const run = wired.pipelines.createRun({ pipelineId: pipeline.pipelineId })!;

      const context: PipelineContext = {
        input: { experiment },
        output: {},
        variables: {},
        metadata: {},
      };

      const result = await wired.executor.execute(pipeline, context, run);

      expect(result.success).toBe(true);
      expect(run.status).toBe(PipelineRunStatus.COMPLETED);
      expect(pipeline.steps.map((s) => s.stepId)).toEqual([
        'knowledge.prepare',
        'knowledge.extract',
        'knowledge.upsert',
      ]);

      const entry = readKnowledgeEntry(result.context);
      expect(entry.experimentId).toBe('exp-pipeline-1');
      expect(entry.title).toBe('donchian-breakout on ds-1: NEEDS_REVIEW');
      expect(wired.service.list(DEFAULT_WORKSPACE_ID)).toHaveLength(1);
      expect(wired.service.getByExperimentId('exp-pipeline-1', DEFAULT_WORKSPACE_ID)).toEqual(
        entry,
      );
    });

    it('matches createFromExperiment output', async () => {
      const experiment = sampleExperiment();
      const viaOrchestrator = await wired.service.createFromExperiment(experiment);

      const again = createKnowledgeDomainService();
      const pipeline = again.templates.createPipelineFromTemplate(
        BUILTIN_PIPELINE_TEMPLATE_IDS.knowledge,
      )!;
      const run = again.pipelines.createRun({ pipelineId: pipeline.pipelineId })!;
      const result = await again.executor.execute(
        pipeline,
        { input: { experiment }, output: {}, variables: {}, metadata: {} },
        run,
      );
      const viaExecutor = readKnowledgeEntry(result.context);

      expect(viaExecutor.title).toBe(viaOrchestrator.title);
      expect(viaExecutor.summary).toBe(viaOrchestrator.summary);
      expect(viaExecutor.tags).toEqual(viaOrchestrator.tags);
      expect(viaExecutor.insights).toEqual(viaOrchestrator.insights);
      expect(viaExecutor.metadata).toEqual(viaOrchestrator.metadata);
      expect(viaExecutor.createdAt).toBe(viaOrchestrator.createdAt);
      expect(viaExecutor.experimentId).toBe(viaOrchestrator.experimentId);
    });

    it('fails when current version report is missing', async () => {
      const broken: Experiment = {
        ...sampleExperiment(),
        currentVersion: 99,
      };

      await expect(wired.service.createFromExperiment(broken)).rejects.toThrow(/has no version 99/);
    });
  });
});
