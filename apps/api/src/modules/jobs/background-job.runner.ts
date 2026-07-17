import { Inject, Injectable } from '@nestjs/common';
import { CampaignReplayService } from '../campaign-replay/campaign-replay.service';
import { ReplayStatus } from '../campaign-replay/replay-status';
import { ResearchCampaignService } from '../research-campaign/research-campaign.service';
import type { Job } from './job';
import type { JobQueue } from './job-queue';
import { JOB_QUEUE } from './job-queue.token';
import type { JobRunner } from './job-runner';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

/**
 * Executes queued Campaign / Replay jobs via existing services (US071–US073).
 * Uses JOB_QUEUE only — no Repository, History, or HTTP.
 * CANCELLED jobs are never dequeued for execution (skipped).
 */
@Injectable()
export class BackgroundJobRunner implements JobRunner {
  constructor(
    @Inject(JOB_QUEUE) private readonly queue: JobQueue,
    private readonly campaigns: ResearchCampaignService,
    private readonly replays: CampaignReplayService,
  ) {}

  async processNext(): Promise<Job | null> {
    const job = this.queue.dequeue();
    if (!job) return null;
    // dequeue only returns PENDING; CANCELLED are skipped in the queue
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.status = JobStatus.FAILED;
      job.completedAt = new Date().toISOString();
      job.result = {
        success: false,
        error: message,
      };
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
