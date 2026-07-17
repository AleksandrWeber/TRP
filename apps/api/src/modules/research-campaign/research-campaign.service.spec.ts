import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { NoOpMetrics } from '../../metrics/noop.metrics';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineHookRegistry } from '../pipeline/pipeline-hook-registry';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { registerCampaignPipelineSteps } from '../pipeline/steps/campaign/register-campaign-steps';
import { CampaignReportService } from './campaign-report.service';
import { ResearchCampaignService } from './research-campaign.service';

function createCampaignService(experiments: { run: ReturnType<typeof vi.fn> }) {
  const reports = new CampaignReportService();
  const sessionFactory = new CampaignSessionFactory();
  const persistence = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    exists: vi.fn(),
    delete: vi.fn(),
  };

  const stepRegistry = new PipelineRegistry();
  registerCampaignPipelineSteps(stepRegistry, {
    experiments: experiments as never,
    reports,
    sessionFactory,
    persistence: persistence as never,
  });

  const executor = new PipelineExecutor(
    stepRegistry,
    new PipelineHookRegistry(),
    new NoOpMetrics(),
  );
  const pipelines = new PipelineDomainService();
  const templates = new PipelineTemplateService(pipelines);

  const service = new ResearchCampaignService(
    executor,
    templates,
    pipelines,
    sessionFactory,
    persistence as never,
  );

  return { service, reports, sessionFactory, persistence, executor, templates };
}

describe('ResearchCampaignService', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: ResearchCampaignService;

  beforeEach(() => {
    experiments = { run: vi.fn() };
    ({ service } = createCampaignService(experiments));
  });

  it('runs all configs and creates one experiment per config', async () => {
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

    const paramsList = [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }];

    const { summary, experiments: created } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList,
    });

    expect(experiments.run).toHaveBeenCalledTimes(3);
    expect(created).toHaveLength(3);
    expect(summary.totalRuns).toBe(3);
    expect(summary.passCount).toBe(1);
    expect(summary.failCount).toBe(1);
    expect(summary.needsReviewCount).toBe(1);
    expect(summary.failedRuns).toEqual([]);
  });

  it('builds campaign summary aggregates correctly', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-a',
        verdict: 'fail',
        metrics: { profitFactor: 0.4 },
      })
      .mockResolvedValueOnce({
        id: 'exp-b',
        verdict: 'fail',
        metrics: { profitFactor: 0.7 },
      })
      .mockResolvedValueOnce({
        id: 'exp-c',
        verdict: 'pass',
        metrics: { profitFactor: 1.1 },
      });

    const { summary } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'ema-crossover',
      paramsList: [{ emaFast: 5 }, { emaFast: 8 }, { emaFast: 12 }],
    });

    expect(summary.campaignId).toBeTruthy();
    expect(summary.strategyId).toBe('ema-crossover');
    expect(summary.datasetId).toBe('ds-1');
    expect(summary.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(summary.totalRuns).toBe(3);
    expect(summary.passCount).toBe(1);
    expect(summary.failCount).toBe(2);
    expect(summary.needsReviewCount).toBe(0);
  });

  it('selects bestExperimentId by highest profit factor', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-low',
        verdict: 'fail',
        metrics: { profitFactor: 0.3 },
      })
      .mockResolvedValueOnce({
        id: 'exp-best',
        verdict: 'fail',
        metrics: { profitFactor: 0.9 },
      })
      .mockResolvedValueOnce({
        id: 'exp-mid',
        verdict: 'fail',
        metrics: { profitFactor: 0.6 },
      });

    const { summary } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
    });

    expect(summary.bestExperimentId).toBe('exp-best');
  });

  it('continues campaign when one run fails and records it in summary', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'pass',
        metrics: { profitFactor: 1.05 },
      })
      .mockRejectedValueOnce(new Error('dataset missing'))
      .mockResolvedValueOnce({
        id: 'exp-3',
        verdict: 'fail',
        metrics: { profitFactor: 0.8 },
      });

    const { summary, experiments: created } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
    });

    expect(experiments.run).toHaveBeenCalledTimes(3);
    expect(created).toHaveLength(2);
    expect(summary.totalRuns).toBe(3);
    expect(summary.passCount).toBe(1);
    expect(summary.failCount).toBe(1);
    expect(summary.needsReviewCount).toBe(0);
    expect(summary.bestExperimentId).toBe('exp-1');
    expect(summary.failedRuns).toEqual([
      {
        params: { channelPeriod: 20 },
        error: 'dataset missing',
      },
    ]);
  });
});

describe('ResearchCampaignService persistence integration', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: ResearchCampaignService;
  let persistence: { save: ReturnType<typeof vi.fn> };
  let reports: CampaignReportService;

  beforeEach(() => {
    experiments = { run: vi.fn() };
    ({ service, persistence, reports } = createCampaignService(experiments));
  });

  it('persists one COMPLETED session for a successful execution', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.2, totalReturnPercent: 4 },
      report: { params: { channelPeriod: 10 } },
    });

    await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
    });

    expect(persistence.save).toHaveBeenCalledTimes(1);
    const saved = persistence.save.mock.calls[0][0];
    expect(saved.status).toBe(CampaignSessionStatus.COMPLETED);
    expect(saved.completedAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(saved.completedAt))).toBe(false);
    expect(saved.report.campaignId).toBeTruthy();
    expect(saved.report.verdict).toBe('PASS');
    expect(saved.metadata.datasetId).toBe('ds-1');
  });

  it('persists one FAILED session and rethrows when execution fails', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.2 },
    });
    vi.spyOn(reports, 'build').mockImplementation(() => {
      throw new Error('report build failed');
    });

    await expect(
      service.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      }),
    ).rejects.toThrow('report build failed');

    expect(persistence.save).toHaveBeenCalledTimes(1);
    const saved = persistence.save.mock.calls[0][0];
    expect(saved.status).toBe(CampaignSessionStatus.FAILED);
    expect(saved.completedAt).toEqual(expect.any(String));
    expect(saved.report.verdict).toBe('FAIL');
    expect(saved.report.recommendations).toContain('Campaign execution failed.');
  });

  it('creates exactly one session per execution', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'pass',
        metrics: { profitFactor: 1.2 },
      })
      .mockResolvedValueOnce({
        id: 'exp-2',
        verdict: 'fail',
        metrics: { profitFactor: 0.5 },
      });

    await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
    });

    expect(persistence.save).toHaveBeenCalledTimes(1);
  });

  it('skips persistence when persistSession is false', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.2 },
    });

    await service.run(
      {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
      { persistSession: false },
    );

    expect(persistence.save).not.toHaveBeenCalled();
  });
});

describe('ResearchCampaignService slice support', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: ResearchCampaignService;
  let reports: CampaignReportService;

  beforeEach(() => {
    experiments = { run: vi.fn() };
    ({ service, reports } = createCampaignService(experiments));
  });

  it('runs a campaign on the full dataset without sliceIdentity', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.2 },
      report: { params: { channelPeriod: 10 } },
    });

    const {
      summary,
      experiments: created,
      sliceIdentity,
    } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
    });

    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 10 },
      undefined,
    );
    expect(sliceIdentity).toBeUndefined();
    expect(created).toHaveLength(1);

    const report = reports.build(summary, created);
    expect(report).not.toHaveProperty('sliceIdentity');
  });

  it('runs a campaign on a TRAIN slice and records sliceIdentity', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-train',
      verdict: 'pass',
      metrics: { profitFactor: 1.1 },
      report: { params: { channelPeriod: 10 }, sliceIdentity: 'ds-1:0:39:TRAIN' },
    });

    const sliceRef = {
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 39,
      role: 'TRAIN' as const,
    };

    const result = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
      sliceRef,
    });

    expect(experiments.run).toHaveBeenCalledTimes(2);
    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 10 },
      sliceRef,
    );
    expect(result.sliceIdentity).toBe('ds-1:0:39:TRAIN');

    const report = reports.build(result.summary, result.experiments, {
      sliceIdentity: result.sliceIdentity,
    });
    expect(report.sliceIdentity).toBe('ds-1:0:39:TRAIN');
  });

  it('runs a campaign on a TEST slice and records sliceIdentity', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-test',
      verdict: 'fail',
      metrics: { profitFactor: 0.8 },
    });

    const sliceRef = {
      datasetId: 'ds-1',
      startIndex: 40,
      endIndex: 59,
      role: 'TEST' as const,
    };

    const result = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
      sliceRef,
    });

    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 10 },
      sliceRef,
    );
    expect(result.sliceIdentity).toBe('ds-1:40:59:TEST');

    const report = reports.build(result.summary, result.experiments, {
      sliceIdentity: result.sliceIdentity,
    });
    expect(report.sliceIdentity).toBe('ds-1:40:59:TEST');
  });

  it('records failed runs when the slice is invalid for experiments', async () => {
    experiments.run.mockRejectedValue(new Error('Slice endIndex 99 is out of bounds'));

    const result = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
      sliceRef: {
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 99,
        role: 'TRAIN',
      },
    });

    expect(result.experiments).toHaveLength(0);
    expect(result.summary.failedRuns).toHaveLength(1);
    expect(result.summary.failedRuns[0].error).toContain('out of bounds');
    expect(result.sliceIdentity).toBe('ds-1:0:99:TRAIN');
  });

  it('does not put sliceIdentity on full-dataset campaign reports', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.0 },
    });

    const {
      summary,
      experiments: created,
      sliceIdentity,
    } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'ema-crossover',
      paramsList: [{ emaFast: 12, emaSlow: 26 }],
    });

    expect(sliceIdentity).toBeUndefined();
    const report = reports.build(summary, created);
    expect('sliceIdentity' in report).toBe(false);
  });
});

describe('ResearchCampaignService pipeline orchestration (US088)', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: ResearchCampaignService;
  let reports: CampaignReportService;
  let persistence: { save: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    experiments = { run: vi.fn() };
    ({ service, reports, persistence } = createCampaignService(experiments));
  });

  it('produces identical CampaignReport via pipeline context output', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'fail',
        metrics: {
          profitFactor: 0.5,
          totalReturnPercent: 1,
          expectancy: 0.1,
          maxDrawdownPercent: 8,
        },
        report: { params: { channelPeriod: 10 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-2',
        verdict: 'pass',
        metrics: {
          profitFactor: 1.5,
          totalReturnPercent: 9,
          expectancy: 0.4,
          maxDrawdownPercent: 3,
        },
        report: { params: { channelPeriod: 20 } },
      });

    const result = await service.run(
      {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
      },
      { persistSession: false },
    );

    const expectedReport = reports.build(result.summary, result.experiments, {
      sliceIdentity: result.sliceIdentity,
    });

    expect(persistence.save).not.toHaveBeenCalled();
    expect(result.summary.bestExperimentId).toBe('exp-2');
    expect(expectedReport.verdict).toBe('PASS');
    expect(expectedReport.bestProfitFactor).toBe(1.5);
    expect(expectedReport.recommendations.length).toBeGreaterThan(0);
  });
});
