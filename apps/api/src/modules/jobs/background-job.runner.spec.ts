import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { ReplayStatus } from '../campaign-replay/replay-status';
import { NoOpMetrics } from '../../metrics/noop.metrics';
import { BackgroundJobRunner } from './background-job.runner';
import { InMemoryJobQueue } from './in-memory-job.queue';
import { JobService } from './job.service';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

function sampleSession() {
  return {
    id: 'sess-1',
    workspaceId: 'ws-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
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

describe('BackgroundJobRunner', () => {
  let queue: InMemoryJobQueue;
  let jobs: JobService;
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let replays: { execute: ReturnType<typeof vi.fn> };
  let runner: BackgroundJobRunner;
  let persistence: { save: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    queue = new InMemoryJobQueue();
    jobs = new JobService(queue);
    campaigns = { run: vi.fn() };
    replays = { execute: vi.fn() };
    persistence = { save: vi.fn() };
    runner = new BackgroundJobRunner(
      queue,
      campaigns as never,
      replays as never,
      new NoOpMetrics(),
    );
  });

  it('processes a campaign job to COMPLETED with result', async () => {
    const job = jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
    });
    campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });

    const processed = await runner.processNext();

    expect(processed?.jobId).toBe(job.jobId);
    expect(processed?.status).toBe(JobStatus.COMPLETED);
    expect(processed?.startedAt).toEqual(expect.any(String));
    expect(processed?.completedAt).toEqual(expect.any(String));
    expect(processed?.result).toEqual({
      success: true,
      message: 'CAMPAIGN job completed',
    });
    expect(campaigns.run).toHaveBeenCalledWith(
      {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
      { persistSession: false },
    );
    expect(persistence.save).not.toHaveBeenCalled();
  });

  it('processes a replay job to COMPLETED with result', async () => {
    const session = sampleSession();
    const job = jobs.createReplayJob({
      sourceSessionId: session.id,
      metadata: { session },
    });
    replays.execute.mockResolvedValue({
      replayId: 'replay-xyz',
      sourceSessionId: session.id,
      startedAt: '2026-07-17T12:00:00.000Z',
      completedAt: '2026-07-17T12:01:00.000Z',
      status: ReplayStatus.COMPLETED,
      campaignConfig: {},
      report: session.report,
    });

    const processed = await runner.process(job.jobId);

    expect(processed?.status).toBe(JobStatus.COMPLETED);
    expect(processed?.type).toBe(JobType.REPLAY);
    expect(processed?.replayId).toBe('replay-xyz');
    expect(processed?.result?.success).toBe(true);
    expect(replays.execute).toHaveBeenCalledWith(session);
    expect(campaigns.run).not.toHaveBeenCalled();
  });

  it('transitions PENDING → RUNNING → COMPLETED', async () => {
    const pending = jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-2',
        strategyId: 'ema-crossover',
        paramsList: [{ emaFast: 5, emaSlow: 20 }],
      },
    });
    expect(pending.status).toBe(JobStatus.PENDING);

    campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });
    const done = await runner.process(pending.jobId);

    expect(done?.status).toBe(JobStatus.COMPLETED);
    expect(done?.startedAt).toBeDefined();
    expect(done?.completedAt).toBeDefined();
    expect(queue.get(pending.jobId)?.status).toBe(JobStatus.COMPLETED);
  });

  it('stores FAILED result on execution error', async () => {
    const job = jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
    });
    campaigns.run.mockRejectedValue(new Error('boom'));

    const processed = await runner.processNext();

    expect(processed?.jobId).toBe(job.jobId);
    expect(processed?.status).toBe(JobStatus.FAILED);
    expect(processed?.result).toEqual({
      success: false,
      error: 'boom',
    });
  });

  it('fails campaign job when required metadata is missing', async () => {
    jobs.createCampaignJob({ metadata: { datasetId: 'ds-1' } });

    const processed = await runner.processNext();

    expect(processed?.status).toBe(JobStatus.FAILED);
    expect(processed?.result?.error).toMatch(/requires metadata/);
    expect(campaigns.run).not.toHaveBeenCalled();
  });

  it('fails replay job when replay execution returns FAILED', async () => {
    const session = sampleSession();
    jobs.createReplayJob({
      sourceSessionId: session.id,
      metadata: { session },
    });
    replays.execute.mockResolvedValue({
      replayId: 'replay-fail',
      status: ReplayStatus.FAILED,
      sourceSessionId: session.id,
      startedAt: '2026-07-17T12:00:00.000Z',
      campaignConfig: {},
      report: session.report,
    });

    const processed = await runner.processNext();

    expect(processed?.status).toBe(JobStatus.FAILED);
    expect(processed?.result?.error).toMatch(/Replay execution failed/);
  });

  it('leaves queue empty after processing all jobs', async () => {
    jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
    });
    jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 20 }],
      },
    });
    campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });

    expect(await runner.processNext()).not.toBeNull();
    expect(await runner.processNext()).not.toBeNull();
    expect(await runner.processNext()).toBeNull();
    expect(queue.dequeue()).toBeNull();
  });

  it('does not interact with repository / persistence', async () => {
    jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
    });
    campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });

    await runner.processNext();

    expect(campaigns.run).toHaveBeenCalledWith(expect.any(Object), { persistSession: false });
    expect(persistence.save).not.toHaveBeenCalled();
  });

  it('skips cancelled jobs and never executes them', async () => {
    const cancelled = jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      },
    });
    const next = jobs.createCampaignJob({
      metadata: {
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 20 }],
      },
    });
    jobs.cancelJob(cancelled.jobId);
    campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });

    const processed = await runner.processNext();

    expect(processed?.jobId).toBe(next.jobId);
    expect(processed?.status).toBe(JobStatus.COMPLETED);
    expect(queue.get(cancelled.jobId)?.status).toBe(JobStatus.CANCELLED);
    expect(queue.get(cancelled.jobId)?.result).toBeUndefined();
    expect(campaigns.run).toHaveBeenCalledTimes(1);

    expect(await runner.process(cancelled.jobId)).toBeNull();
    expect(campaigns.run).toHaveBeenCalledTimes(1);
  });
});
