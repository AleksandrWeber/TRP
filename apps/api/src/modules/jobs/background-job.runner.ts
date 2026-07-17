import { Inject, Injectable } from '@nestjs/common';
import { CampaignReplayService } from '../campaign-replay/campaign-replay.service';
import { ReplayStatus } from '../campaign-replay/replay-status';
import { ResearchCampaignService } from '../research-campaign/research-campaign.service';
import type { Metrics } from '../../metrics/metrics';
import { MetricNames } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import type { Job } from './job';
import type { JobQueue } from './job-queue';
import { JOB_QUEUE } from './job-queue.token';
import type { JobRunner } from './job-runner';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

/**
 * Executes queued Campaign / Replay jobs via existing services (US071–US073, US110).
 * Uses JOB_QUEUE only — acknowledge on success, retry (backoff / DLQ) on failure.
 * CANCELLED jobs are never dequeued for execution (skipped).
 */
@Injectable()
export class BackgroundJobRunner implements JobRunner {
  private active = 0;

  constructor(
    @Inject(JOB_QUEUE) private readonly queue: JobQueue,
    @Inject(ResearchCampaignService) private readonly campaigns: ResearchCampaignService,
    @Inject(CampaignReplayService) private readonly replays: CampaignReplayService,
    @Inject(METRICS) private readonly metrics: Metrics,
  ) {}

  async processNext(): Promise<Job | null> {
    const job = this.queue.dequeue();
    if (!job) return null;
    if (job.status === JobStatus.CANCELLED) return null;
    return this.executeJob(job);
  }

  async process(jobId: string): Promise<Job | null> {
    const job = this.queue.get(jobId);
    if (!job) return null;
    if (job.status === JobStatus.CANCELLED) return null;
    if (job.status !== JobStatus.PENDING) return null;
    return this.executeJob(job);
  }

  private async executeJob(job: Job): Promise<Job> {
    job.status = JobStatus.RUNNING;
    job.startedAt = new Date().toISOString();

    this.active += 1;
    this.metrics.gauge(MetricNames.activeJobs, this.active);

    try {
      if (job.type === JobType.CAMPAIGN) {
        await this.executeCampaign(job);
      } else if (job.type === JobType.REPLAY) {
        await this.executeReplay(job);
      } else {
        throw new Error(`Unsupported job type: ${String(job.type)}`);
      }

      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date().toISOString();
      job.result = {
        success: true,
        message: `${job.type} job completed`,
      };
      this.queue.acknowledge(job.jobId);
      this.metrics.increment(MetricNames.jobsProcessedTotal, 1, {
        type: job.type,
        status: 'completed',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.completedAt = new Date().toISOString();
      job.result = {
        success: false,
        error: message,
      };
      this.queue.retry(job.jobId, message);
      this.metrics.increment(MetricNames.jobsProcessedTotal, 1, {
        type: job.type,
        status: 'failed',
      });
      this.metrics.increment(MetricNames.jobsFailedTotal, 1, { type: job.type });
    } finally {
      this.active -= 1;
      this.metrics.gauge(MetricNames.activeJobs, this.active);
    }

    return job;
  }

  private async executeCampaign(job: Job): Promise<void> {
    const { datasetId, strategyId, paramsList } = job.metadata;
    if (!datasetId || !strategyId || !Array.isArray(paramsList) || paramsList.length === 0) {
      throw new Error(
        'CAMPAIGN job requires metadata.datasetId, metadata.strategyId, and non-empty metadata.paramsList',
      );
    }

    await this.campaigns.run(
      {
        datasetId,
        strategyId,
        paramsList,
      },
      { persistSession: false },
    );
  }

  private async executeReplay(job: Job): Promise<void> {
    const session = job.metadata.session;
    if (!session) {
      throw new Error('REPLAY job requires metadata.session');
    }

    const result = await this.replays.execute(session);
    job.replayId = result.replayId;

    if (result.status === ReplayStatus.FAILED) {
      throw new Error('Replay execution failed');
    }
  }
}
