import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobCancelConflictError } from './job-cancel-conflict.error';
import { JobController } from './job.controller';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

describe('JobController', () => {
  let jobs: {
    listJobs: ReturnType<typeof vi.fn>;
    getJob: ReturnType<typeof vi.fn>;
    cancelJob: ReturnType<typeof vi.fn>;
  };
  let controller: JobController;

  const pendingJob = {
    jobId: 'job-pending',
    createdAt: '2026-07-17T12:00:00.000Z',
    status: JobStatus.PENDING,
    type: JobType.CAMPAIGN,
    metadata: { datasetId: 'ds-1', strategyId: 'donchian-breakout' },
  };

  const completedJob = {
    jobId: 'job-done',
    createdAt: '2026-07-17T12:00:00.000Z',
    startedAt: '2026-07-17T12:01:00.000Z',
    completedAt: '2026-07-17T12:02:00.000Z',
    status: JobStatus.COMPLETED,
    type: JobType.REPLAY,
    metadata: { tags: ['replay'] },
    result: { success: true, message: 'REPLAY job completed' },
  };

  const cancelledJob = {
    ...pendingJob,
    jobId: 'job-cancelled',
    status: JobStatus.CANCELLED,
  };

  beforeEach(() => {
    jobs = {
      listJobs: vi.fn(),
      getJob: vi.fn(),
      cancelJob: vi.fn(),
    };
    controller = new JobController(jobs as never);
  });

  it('lists jobs', () => {
    jobs.listJobs.mockReturnValue([pendingJob, completedJob]);

    expect(controller.list()).toEqual([pendingJob, completedJob]);
    expect(jobs.listJobs).toHaveBeenCalledTimes(1);
  });

  it('gets a job by id', () => {
    jobs.getJob.mockReturnValue(pendingJob);

    expect(controller.getById({ jobId: 'job-pending' })).toBe(pendingJob);
    expect(jobs.getJob).toHaveBeenCalledWith('job-pending');
  });

  it('returns 404 when job is not found', () => {
    jobs.getJob.mockReturnValue(null);

    expect(() => controller.getById({ jobId: 'missing' })).toThrow(NotFoundException);
  });

  it('completed job contains result', () => {
    jobs.getJob.mockReturnValue(completedJob);

    const job = controller.getById({ jobId: 'job-done' });

    expect(job.result).toEqual({
      success: true,
      message: 'REPLAY job completed',
    });
  });

  it('pending job has no result', () => {
    jobs.getJob.mockReturnValue(pendingJob);

    expect(controller.getById({ jobId: 'job-pending' }).result).toBeUndefined();
  });

  it('cancels a pending job', () => {
    jobs.cancelJob.mockReturnValue(cancelledJob);

    expect(controller.cancel({ jobId: 'job-cancelled' })).toEqual(cancelledJob);
    expect(jobs.cancelJob).toHaveBeenCalledWith('job-cancelled');
  });

  it('returns 404 when cancelling unknown job', () => {
    jobs.cancelJob.mockReturnValue(null);

    expect(() => controller.cancel({ jobId: 'missing' })).toThrow(NotFoundException);
  });

  it('returns 409 when job cannot be cancelled', () => {
    jobs.cancelJob.mockImplementation(() => {
      throw new JobCancelConflictError(completedJob as never);
    });

    expect(() => controller.cancel({ jobId: 'job-done' })).toThrow(ConflictException);
  });
});
