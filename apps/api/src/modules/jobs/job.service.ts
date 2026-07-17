import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Job } from './job';
import { JobCancelConflictError } from './job-cancel-conflict.error';
import type { JobMetadata } from './job-metadata';
import type { JobQueue } from './job-queue';
import { JOB_QUEUE } from './job-queue.token';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

export type CreateCampaignJobInput = {
  metadata?: JobMetadata;
  sourceSessionId?: string;
};

export type CreateReplayJobInput = {
  sourceSessionId: string;
  replayId?: string;
  metadata?: JobMetadata;
};

/**
 * Creates / reads / cancels Jobs via JobQueue (US069–US073).
 * Depends on JOB_QUEUE token only — never on a concrete queue class.
 * Does not execute jobs.
 */
@Injectable()
export class JobService {
  constructor(@Inject(JOB_QUEUE) private readonly queue: JobQueue) {}

  createCampaignJob(input: CreateCampaignJobInput = {}): Job {
    return this.createJob({
      type: JobType.CAMPAIGN,
      metadata: input.metadata,
      sourceSessionId: input.sourceSessionId,
    });
  }

  createReplayJob(input: CreateReplayJobInput): Job {
    return this.createJob({
      type: JobType.REPLAY,
      metadata: input.metadata,
      sourceSessionId: input.sourceSessionId,
      replayId: input.replayId,
    });
  }

  /** Read-only: all jobs currently known to the queue. */
  listJobs(): Job[] {
    return this.queue.list();
  }

  /** Read-only: single job by id, or null if missing. */
  getJob(jobId: string): Job | null {
    return this.queue.get(jobId);
  }

  /**
   * Cancel a PENDING job.
   * @returns cancelled Job, or null if not found
   * @throws JobCancelConflictError when status is not PENDING
   */
  cancelJob(jobId: string): Job | null {
    const job = this.queue.get(jobId);
    if (!job) return null;
    if (job.status !== JobStatus.PENDING) {
      throw new JobCancelConflictError(job);
    }

    return this.queue.cancel(jobId);
  }

  private createJob(input: {
    type: JobType;
    metadata?: JobMetadata;
    sourceSessionId?: string;
    replayId?: string;
  }): Job {
    const job: Job = {
      jobId: randomUUID(),
      createdAt: new Date().toISOString(),
      status: JobStatus.PENDING,
      type: input.type,
      metadata: cloneMetadata(input.metadata),
    };

    if (input.sourceSessionId !== undefined) {
      job.sourceSessionId = input.sourceSessionId;
    }

    if (input.replayId !== undefined) {
      job.replayId = input.replayId;
    }

    this.queue.enqueue(job);
    return job;
  }
}

function cloneMetadata(metadata?: JobMetadata): JobMetadata {
  if (!metadata) return {};

  const cloned: JobMetadata = {};
  if (metadata.engineVersion !== undefined) cloned.engineVersion = metadata.engineVersion;
  if (metadata.datasetId !== undefined) cloned.datasetId = metadata.datasetId;
  if (metadata.strategyId !== undefined) cloned.strategyId = metadata.strategyId;
  if (metadata.tags !== undefined) cloned.tags = [...metadata.tags];
  if (metadata.paramsList !== undefined) {
    cloned.paramsList = metadata.paramsList.map((params) => ({ ...params }));
  }
  if (metadata.session !== undefined) {
    cloned.session = metadata.session;
  }
  return cloned;
}
