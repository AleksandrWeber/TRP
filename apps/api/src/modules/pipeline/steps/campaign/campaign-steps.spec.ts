import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignPersistenceService } from '../../../campaign-persistence/campaign-persistence.service';
import { CampaignSessionFactory } from '../../../campaign-session/campaign-session.factory';
import { CampaignSessionStatus } from '../../../campaign-session/campaign-session-status';
import { CampaignReportService } from '../../../research-campaign/campaign-report.service';
import { ResearchCampaignService } from '../../../research-campaign/research-campaign.service';
import { NoOpMetrics } from '../../../../metrics/noop.metrics';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../../builtin-pipeline-templates';
import type { PipelineContext } from '../../pipeline-context';
import { PipelineDomainService } from '../../pipeline-domain.service';
import { PipelineExecutor } from '../../pipeline-executor';
import { PipelineHookRegistry } from '../../pipeline-hook-registry';
import { PipelineRegistry } from '../../pipeline-registry';
import { PipelineTemplateService } from '../../pipeline-template.service';
import { AggregateResultStep } from './aggregate-result.step';
import { BuildReportStep } from './build-report.step';
import { readReport, readSummary } from './campaign-context';
import { CAMPAIGN_PIPELINE_STEP_METADATA, CAMPAIGN_PIPELINE_STEPS } from './campaign-step-metadata';
import { ExecuteResearchStep } from './execute-research.step';
import { PersistCampaignStep } from './persist-campaign.step';
import { PrepareCampaignStep } from './prepare-campaign.step';
import { registerCampaignPipelineSteps } from './register-campaign-steps';

function emptyContext(
  input: Record<string, unknown>,
  overrides?: Partial<PipelineContext>,
): PipelineContext {
  return {
    input,
    output: {},
    variables: {},
    metadata: {},
    ...overrides,
  };
}

function createDeps(experiments: { run: ReturnType<typeof vi.fn> }) {
  const reports = new CampaignReportService();
  const sessionFactory = new CampaignSessionFactory();
  const persistence = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    exists: vi.fn(),
    delete: vi.fn(),
  } as unknown as CampaignPersistenceService;

  return {
    experiments: experiments as never,
    reports,
    sessionFactory,
    persistence,
  };
}

describe('Campaign Pipeline Steps (US087)', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let deps: ReturnType<typeof createDeps>;

  beforeEach(() => {
    experiments = { run: vi.fn() };
    deps = createDeps(experiments);
  });

  it('PrepareCampaignStep initializes campaign state', async () => {
    const step = new PrepareCampaignStep();
    const context = await step.execute(
      emptyContext({
        datasetId: 'ds-1',
        strategyId: 'ema-crossover',
        paramsList: [{ emaFast: 5 }],
        sliceRef: {
          datasetId: 'ds-1',
          startIndex: 0,
          endIndex: 99,
          role: 'TRAIN',
        },
      }),
    );

    expect(context.variables.campaignId).toEqual(expect.any(String));
    expect(context.variables.createdAt).toEqual(expect.any(String));
    expect(context.variables.sliceIdentity).toEqual(expect.any(String));
    expect(context.variables.passCount).toBe(0);
    expect(context.variables.experiments).toEqual([]);
    expect(step.getMetadata()).toEqual(CAMPAIGN_PIPELINE_STEP_METADATA.prepare);
  });

  it('ExecuteResearchStep runs experiments and tallies verdicts', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'pass',
        metrics: { profitFactor: 1.2 },
        report: { params: { channelPeriod: 20 } },
      })
      .mockRejectedValueOnce(new Error('dataset missing'));

    const prepared = await new PrepareCampaignStep().execute(
      emptyContext({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 20 }, { channelPeriod: 30 }],
      }),
    );

    const executed = await new ExecuteResearchStep(deps.experiments).execute(prepared);

    expect(experiments.run).toHaveBeenCalledTimes(2);
    expect(executed.variables.passCount).toBe(1);
    expect(executed.variables.failCount).toBe(0);
    expect(executed.variables.experiments).toHaveLength(1);
    expect(executed.variables.failedRuns).toEqual([
      { params: { channelPeriod: 30 }, error: 'dataset missing' },
    ]);
    expect(executed.variables.bestExperimentId).toBe('exp-1');
  });

  it('AggregateResultStep builds CampaignSummary', async () => {
    experiments.run.mockResolvedValueOnce({
      id: 'exp-a',
      verdict: 'pass',
      metrics: { profitFactor: 1.1 },
      report: { params: { emaFast: 5 } },
    });

    let context = await new PrepareCampaignStep().execute(
      emptyContext({
        datasetId: 'ds-1',
        strategyId: 'ema-crossover',
        paramsList: [{ emaFast: 5 }],
      }),
    );
    context = await new ExecuteResearchStep(deps.experiments).execute(context);
    context = await new AggregateResultStep().execute(context);

    const summary = readSummary(context);
    expect(summary.datasetId).toBe('ds-1');
    expect(summary.strategyId).toBe('ema-crossover');
    expect(summary.totalRuns).toBe(1);
    expect(summary.passCount).toBe(1);
    expect(summary.bestExperimentId).toBe('exp-a');
    expect(context.output.experiments).toHaveLength(1);
  });

  it('BuildReportStep builds CampaignReport via CampaignReportService', async () => {
    experiments.run.mockResolvedValueOnce({
      id: 'exp-b',
      verdict: 'pass',
      metrics: {
        profitFactor: 1.4,
        totalReturnPercent: 12,
        expectancy: 0.2,
        maxDrawdownPercent: 5,
      },
      report: { params: { channelPeriod: 10 } },
    });

    let context = await new PrepareCampaignStep().execute(
      emptyContext({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      }),
    );
    context = await new ExecuteResearchStep(deps.experiments).execute(context);
    context = await new AggregateResultStep().execute(context);
    context = await new BuildReportStep(deps.reports).execute(context);

    const report = readReport(context);
    const expected = deps.reports.build(readSummary(context), context.output.experiments as never);
    expect(report).toEqual(expected);
    expect(report.verdict).toBe('PASS');
  });

  it('PersistCampaignStep persists COMPLETED session when enabled', async () => {
    experiments.run.mockResolvedValueOnce({
      id: 'exp-c',
      verdict: 'fail',
      metrics: { profitFactor: 0.5 },
      report: { params: { channelPeriod: 10 } },
    });

    let context = await new PrepareCampaignStep().execute(
      emptyContext({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      }),
    );
    context = await new ExecuteResearchStep(deps.experiments).execute(context);
    context = await new AggregateResultStep().execute(context);
    context = await new BuildReportStep(deps.reports).execute(context);
    context = await new PersistCampaignStep(deps.sessionFactory, deps.persistence).execute(context);

    expect(deps.persistence.save).toHaveBeenCalledTimes(1);
    expect(deps.persistence.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CampaignSessionStatus.COMPLETED,
        report: readReport(context),
      }),
    );
    expect(context.metadata.persisted).toBe(true);
  });

  it('PersistCampaignStep skips persistence when persistSession=false', async () => {
    let context = await new PrepareCampaignStep().execute(
      emptyContext({
        datasetId: 'ds-1',
        strategyId: 'ema-crossover',
        paramsList: [],
        persistSession: false,
      }),
    );
    context = await new AggregateResultStep().execute(context);
    context = await new BuildReportStep(deps.reports).execute(context);
    context = await new PersistCampaignStep(deps.sessionFactory, deps.persistence).execute(context);

    expect(deps.persistence.save).not.toHaveBeenCalled();
    expect(context.metadata.persisted).toBe(false);
  });

  it('registers all Campaign steps in PipelineRegistry', () => {
    const registry = new PipelineRegistry();
    registerCampaignPipelineSteps(registry, deps);

    for (const meta of CAMPAIGN_PIPELINE_STEPS) {
      const step = registry.get(meta.stepId);
      expect(step).not.toBeNull();
      expect((step as PrepareCampaignStep).getMetadata?.() ?? meta).toBeTruthy();
    }

    expect(registry.list()).toHaveLength(5);
    expect(registry.list().map((s) => s.getMetadata().order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('Campaign template contains correct ordered step metadata', () => {
    const templates = new PipelineTemplateService(new PipelineDomainService());
    const pipeline = templates.createPipelineFromTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.campaign)!;

    expect(pipeline.steps).toEqual(CAMPAIGN_PIPELINE_STEPS);
    expect(pipeline.steps.map((s) => s.order)).toEqual([1, 2, 3, 4, 5]);
    expect(pipeline.steps.map((s) => s.stepId)).toEqual([
      'campaign.prepare',
      'campaign.execute',
      'campaign.aggregate',
      'campaign.build-report',
      'campaign.persist',
    ]);
  });

  it('step pipeline output matches ResearchCampaignService for the same mocks', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'fail',
        metrics: { profitFactor: 0.5 },
        report: { params: { channelPeriod: 10 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-2',
        verdict: 'pass',
        metrics: { profitFactor: 1.2 },
        report: { params: { channelPeriod: 20 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-3',
        verdict: 'needs_review',
        metrics: { profitFactor: 1.0 },
        report: { params: { channelPeriod: 30 } },
      });

    const input = {
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
    };

    const stepRegistry = new PipelineRegistry();
    registerCampaignPipelineSteps(stepRegistry, deps);
    const pipelines = new PipelineDomainService();
    const templates = new PipelineTemplateService(pipelines);
    const service = new ResearchCampaignService(
      new PipelineExecutor(stepRegistry, new PipelineHookRegistry(), new NoOpMetrics()),
      templates,
      pipelines,
      deps.sessionFactory,
      deps.persistence,
    );
    const serviceResult = await service.run(input, { persistSession: false });
    const serviceReport = deps.reports.build(serviceResult.summary, serviceResult.experiments, {
      sliceIdentity: serviceResult.sliceIdentity,
    });

    // Reset mock call history and re-seed identical responses for step path.
    experiments.run.mockReset();
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'fail',
        metrics: { profitFactor: 0.5 },
        report: { params: { channelPeriod: 10 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-2',
        verdict: 'pass',
        metrics: { profitFactor: 1.2 },
        report: { params: { channelPeriod: 20 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-3',
        verdict: 'needs_review',
        metrics: { profitFactor: 1.0 },
        report: { params: { channelPeriod: 30 } },
      });

    let context = emptyContext({ ...input, persistSession: false });
    context = await new PrepareCampaignStep().execute(context);
    context = await new ExecuteResearchStep(deps.experiments).execute(context);
    context = await new AggregateResultStep().execute(context);
    context = await new BuildReportStep(deps.reports).execute(context);
    context = await new PersistCampaignStep(deps.sessionFactory, deps.persistence).execute(context);

    const stepSummary = readSummary(context);
    const stepReport = readReport(context);

    expect(stepSummary).toEqual({
      ...serviceResult.summary,
      campaignId: stepSummary.campaignId,
      createdAt: stepSummary.createdAt,
    });
    expect(stepSummary.passCount).toBe(serviceResult.summary.passCount);
    expect(stepSummary.failCount).toBe(serviceResult.summary.failCount);
    expect(stepSummary.needsReviewCount).toBe(serviceResult.summary.needsReviewCount);
    expect(stepSummary.bestExperimentId).toBe(serviceResult.summary.bestExperimentId);
    expect(context.output.experiments).toEqual(serviceResult.experiments);
    expect(stepReport).toEqual({
      ...serviceReport,
      campaignId: stepReport.campaignId,
      createdAt: stepReport.createdAt,
    });
    expect(stepReport.verdict).toBe(serviceReport.verdict);
    expect(stepReport.recommendations).toEqual(serviceReport.recommendations);
    expect(deps.persistence.save).not.toHaveBeenCalled();
  });
});
