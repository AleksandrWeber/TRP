import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { LoggingModule } from '../../logging/logging.module';
import { MetricsModule } from '../../metrics/metrics.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { InMemoryJobQueue } from './in-memory-job.queue';
import { JobCancelConflictError } from './job-cancel-conflict.error';
import type { JobQueue } from './job-queue';
import { JOB_QUEUE } from './job-queue.token';
import { JobService } from './job.service';
import { JobStatus } from './job-status';
import { JobType } from './job-type';
import { JobsModule } from './jobs.module';

describe('JobService + JobQueue (US070)', () => {
  it('enqueues campaign job on create (status PENDING)', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);

    const job = service.createCampaignJob({
      sourceSessionId: 'sess-1',
      metadata: { strategyId: 'donchian-breakout', datasetId: 'ds-1' },
    });

    expect(job.type).toBe(JobType.CAMPAIGN);
    expect(job.status).toBe(JobStatus.PENDING);
    expect(queue.get(job.jobId)).toBe(job);
    expect(queue.dequeue()?.jobId).toBe(job.jobId);
  });

  it('enqueues replay job on create (status PENDING)', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);

    const job = service.createReplayJob({
      sourceSessionId: 'sess-source',
      replayId: 'replay-1',
      metadata: { tags: ['replay'] },
    });

    expect(job.type).toBe(JobType.REPLAY);
    expect(job.status).toBe(JobStatus.PENDING);
    expect(queue.get(job.jobId)?.replayId).toBe('replay-1');
  });

  it('sets createdAt and leaves startedAt/completedAt unset', () => {
    const service = new JobService(new InMemoryJobQueue());
    const job = service.createCampaignJob();

    expect(job.createdAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(job.createdAt))).toBe(false);
    expect(job.startedAt).toBeUndefined();
    expect(job.completedAt).toBeUndefined();
  });

  it('assigns metadata (cloned) and generates jobId', () => {
    const tags = ['async'];
    const service = new JobService(new InMemoryJobQueue());
    const job = service.createCampaignJob({
      metadata: { engineVersion: '1.0.3', tags },
    });

    expect(job.jobId.length).toBeGreaterThan(0);
    expect(job.metadata).toEqual({ engineVersion: '1.0.3', tags: ['async'] });
    expect(job.metadata.tags).not.toBe(tags);
  });

  it('exposes JobStatus and JobType enums', () => {
    expect(Object.values(JobStatus)).toEqual([
      'PENDING',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ]);
    expect(Object.values(JobType)).toEqual(['CAMPAIGN', 'REPLAY']);
  });

  it('DI registers JOB_QUEUE token (no concrete JobService dependency)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule, MetricsModule, PrismaModule, EventsModule, JobsModule],
    }).compile();

    const service = moduleRef.get(JobService);
    const queue = moduleRef.get<JobQueue>(JOB_QUEUE);

    expect(service).toBeInstanceOf(JobService);
    expect(queue).toBeInstanceOf(InMemoryJobQueue);
    expect(queue).not.toBeInstanceOf(JobService);

    const job = service.createCampaignJob();
    expect(queue.get(job.jobId)?.jobId).toBe(job.jobId);
  });

  it('JobService depends on JobQueue interface shape only', () => {
    const enqueued: string[] = [];
    const fakeQueue: JobQueue = {
      enqueue: (job) => {
        enqueued.push(job.jobId);
      },
      dequeue: () => null,
      acknowledge: () => undefined,
      retry: () => undefined,
      cancel: () => null,
      get: () => null,
      list: () => [],
      listDeadLetters: () => [],
      getEvents: () => [],
    };

    const service = new JobService(fakeQueue);
    const job = service.createCampaignJob();

    expect(enqueued).toEqual([job.jobId]);
  });

  it('lists jobs via queue', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const a = service.createCampaignJob();
    const b = service.createReplayJob({ sourceSessionId: 'sess-1' });

    expect(service.listJobs().map((j) => j.jobId)).toEqual([a.jobId, b.jobId]);
  });

  it('gets a job by id', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const job = service.createCampaignJob({ metadata: { datasetId: 'ds-1' } });

    expect(service.getJob(job.jobId)).toBe(job);
    expect(service.getJob('missing')).toBeNull();
  });

  it('completed job contains result; pending job has no result', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const pending = service.createCampaignJob();
    const completed = service.createCampaignJob();

    const stored = queue.get(completed.jobId)!;
    stored.status = JobStatus.COMPLETED;
    stored.result = { success: true, message: 'done' };

    expect(service.getJob(pending.jobId)?.result).toBeUndefined();
    expect(service.getJob(completed.jobId)?.result).toEqual({
      success: true,
      message: 'done',
    });
  });

  it('queue state is unchanged after reads', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const a = service.createCampaignJob();
    const b = service.createCampaignJob();

    const before = queue.list().map((j) => j.jobId);
    expect(service.listJobs().map((j) => j.jobId)).toEqual(before);
    expect(service.getJob(a.jobId)?.jobId).toBe(a.jobId);
    expect(service.getJob(b.jobId)?.jobId).toBe(b.jobId);
    expect(service.getJob('missing')).toBeNull();

    expect(queue.list().map((j) => j.jobId)).toEqual(before);
    expect(queue.dequeue()?.jobId).toBe(a.jobId);
    expect(queue.dequeue()?.jobId).toBe(b.jobId);
  });

  it('cancels a pending job', () => {
    const service = new JobService(new InMemoryJobQueue());
    const job = service.createCampaignJob();

    const cancelled = service.cancelJob(job.jobId);

    expect(cancelled?.status).toBe(JobStatus.CANCELLED);
    expect(cancelled?.result).toBeUndefined();
    expect(service.getJob(job.jobId)?.status).toBe(JobStatus.CANCELLED);
  });

  it('cannot cancel running job', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const job = service.createCampaignJob();
    queue.get(job.jobId)!.status = JobStatus.RUNNING;

    expect(() => service.cancelJob(job.jobId)).toThrow(JobCancelConflictError);
    expect(service.getJob(job.jobId)?.status).toBe(JobStatus.RUNNING);
  });

  it('cannot cancel completed job', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const job = service.createCampaignJob();
    const stored = queue.get(job.jobId)!;
    stored.status = JobStatus.COMPLETED;
    stored.result = { success: true, message: 'done' };

    expect(() => service.cancelJob(job.jobId)).toThrow(JobCancelConflictError);
  });

  it('cannot cancel failed job', () => {
    const queue = new InMemoryJobQueue();
    const service = new JobService(queue);
    const job = service.createCampaignJob();
    queue.get(job.jobId)!.status = JobStatus.FAILED;

    expect(() => service.cancelJob(job.jobId)).toThrow(JobCancelConflictError);
  });

  it('cannot cancel cancelled job', () => {
    const service = new JobService(new InMemoryJobQueue());
    const job = service.createCampaignJob();
    service.cancelJob(job.jobId);

    expect(() => service.cancelJob(job.jobId)).toThrow(JobCancelConflictError);
  });

  it('returns null when cancelling unknown job', () => {
    const service = new JobService(new InMemoryJobQueue());
    expect(service.cancelJob('missing')).toBeNull();
  });
});
