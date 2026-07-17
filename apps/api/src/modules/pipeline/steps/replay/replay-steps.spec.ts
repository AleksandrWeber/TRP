import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReplayStatus } from '../../../campaign-replay/replay-status';
import { CampaignSessionStatus } from '../../../campaign-session/campaign-session-status';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../../builtin-pipeline-templates';
import type { PipelineContext } from '../../pipeline-context';
import { PipelineDomainService } from '../../pipeline-domain.service';
import { PipelineExecutor } from '../../pipeline-executor';
import { PipelineHookRegistry } from '../../pipeline-hook-registry';
import { PipelineRegistry } from '../../pipeline-registry';
import { PipelineRunStatus } from '../../pipeline-run-status';
import { PipelineTemplateService } from '../../pipeline-template.service';
import { ExecuteReplayCampaignStep } from './execute-replay-campaign.step';
import { FinalizeReplayStep } from './finalize-replay.step';
import { LoadReplaySessionStep } from './load-replay-session.step';
import { readReplayResult } from './replay-pipeline-context';
import { REPLAY_PIPELINE_STEP_METADATA, REPLAY_PIPELINE_STEPS } from './replay-step-metadata';
import { registerReplayPipelineSteps } from './register-replay-steps';
import { RestoreReplayContextStep } from './restore-replay-context.step';

function sampleSession() {
  return {
    id: 'sess-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    metadata: {
      engineVersion: '1.0.3',
      paramsList: [{ channelPeriod: 10 }],
    },
    report: {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 1,
      passCount: 1,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: 'exp-1',
      bestProfitFactor: 1.2,
      bestReturn: 3,
      bestExpectancy: 1,
      lowestDrawdown: 8,
      verdict: 'PASS' as const,
      recommendations: ['ok'],
      createdAt: '2026-07-17T10:04:00.000Z',
    },
  };
}

function emptyContext(session: unknown): PipelineContext {
  return {
    input: { session },
    output: {},
    variables: {},
    metadata: {},
  };
}

describe('Replay Pipeline Steps (US089)', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let reports: { build: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    campaigns = { run: vi.fn() };
    reports = { build: vi.fn() };
  });

  it('LoadReplaySessionStep validates session', async () => {
    const step = new LoadReplaySessionStep();
    const context = await step.execute(emptyContext(sampleSession()));
    expect(context.variables.session).toEqual(sampleSession());
    expect(step.getMetadata()).toEqual(REPLAY_PIPELINE_STEP_METADATA.load);
  });

  it('RestoreReplayContextStep restores config and clones report', async () => {
    let context = await new LoadReplaySessionStep().execute(emptyContext(sampleSession()));
    context = await new RestoreReplayContextStep().execute(context);

    expect(context.variables.campaignConfig).toEqual(
      expect.objectContaining({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      }),
    );
    expect(context.variables.sourceReport).toEqual(sampleSession().report);
    expect(context.variables.sourceReport).not.toBe(sampleSession().report);
  });

  it('ExecuteReplayCampaignStep runs campaign without persistence', async () => {
    campaigns.run.mockResolvedValue({ summary: { x: 1 }, experiments: [] });
    let context = await new LoadReplaySessionStep().execute(emptyContext(sampleSession()));
    context = await new RestoreReplayContextStep().execute(context);
    context = await new ExecuteReplayCampaignStep(campaigns as never).execute(context);

    expect(campaigns.run).toHaveBeenCalledWith(
      {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
      { persistSession: false },
    );
    expect(context.variables.executeFailed).toBe(false);
    expect(context.variables.campaignResult).toEqual({ summary: { x: 1 }, experiments: [] });
  });

  it('FinalizeReplayStep builds COMPLETED ReplayResult', async () => {
    const fresh = {
      ...sampleSession().report,
      campaignId: 'camp-new',
      recommendations: ['regenerated'],
    };
    campaigns.run.mockResolvedValue({ summary: { s: 1 }, experiments: [{ id: 'e1' }] });
    reports.build.mockReturnValue(fresh);

    let context = await new LoadReplaySessionStep().execute(emptyContext(sampleSession()));
    context = await new RestoreReplayContextStep().execute(context);
    context = await new ExecuteReplayCampaignStep(campaigns as never).execute(context);
    context = await new FinalizeReplayStep(reports as never).execute(context);

    const result = readReplayResult(context);
    expect(result.status).toBe(ReplayStatus.COMPLETED);
    expect(result.report).toEqual(fresh);
  });

  it('registers all Replay steps in order', () => {
    const registry = new PipelineRegistry();
    registerReplayPipelineSteps(registry, {
      campaigns: campaigns as never,
      reports: reports as never,
    });

    expect(registry.list().map((s) => s.getMetadata().stepId)).toEqual([
      'replay.load',
      'replay.restore',
      'replay.execute',
      'replay.finalize',
    ]);
    expect(registry.list().map((s) => s.getMetadata().order)).toEqual([1, 2, 3, 4]);
  });

  it('Replay template contains correct ordered step metadata', () => {
    const templates = new PipelineTemplateService(new PipelineDomainService());
    const pipeline = templates.createPipelineFromTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.replay)!;
    expect(pipeline.steps).toEqual(REPLAY_PIPELINE_STEPS);
  });

  it('pipeline executor preserves ReplayResult shape end-to-end', async () => {
    const fresh = {
      ...sampleSession().report,
      campaignId: 'camp-pipeline',
      recommendations: ['via pipeline'],
    };
    campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });
    reports.build.mockReturnValue(fresh);

    const registry = new PipelineRegistry();
    registerReplayPipelineSteps(registry, {
      campaigns: campaigns as never,
      reports: reports as never,
    });
    const pipelines = new PipelineDomainService();
    const templates = new PipelineTemplateService(pipelines);
    const executor = new PipelineExecutor(registry, new PipelineHookRegistry());
    const pipeline = templates.createPipelineFromTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.replay)!;
    const run = pipelines.createRun({ pipelineId: pipeline.pipelineId })!;

    const result = await executor.execute(pipeline, emptyContext(sampleSession()), run);
    expect(result.success).toBe(true);
    expect(readReplayResult(result.context).status).toBe(ReplayStatus.COMPLETED);
    expect(readReplayResult(result.context).report).toEqual(fresh);
    expect(run.status).toBe(PipelineRunStatus.COMPLETED);
  });
});
