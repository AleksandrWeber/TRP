import { describe, expect, it } from 'vitest';
import { InMemoryJobQueue } from './in-memory-job.queue';
import type { Job } from './job';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

function pendingJob(overrides?: Partial<Job>): Job {
  return {
    jobId: overrides?.jobId ?? `job-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: '2026-07-17T12:00:00.000Z',
    status: JobStatus.PENDING,
    type: overrides?.type ?? JobType.CAMPAIGN,
    metadata: overrides?.metadata ?? {},
    ...overrides,
  };
}

describe('InMemoryJobQueue', () => {
  it('enqueues and gets a campaign job', () => {
    const queue = new InMemoryJobQueue();
    const job = pendingJob({ jobId: 'c1', type: JobType.CAMPAIGN });

    queue.enqueue(job);

    expect(queue.get('c1')).toBe(job);
    expect(queue.get('c1')?.type).toBe(JobType.CAMPAIGN);
  });

  it('enqueues and gets a replay job', () => {
    const queue = new InMemoryJobQueue();
    const job = pendingJob({
      jobId: 'r1',
      type: JobType.REPLAY,
      sourceSessionId: 'sess-1',
      replayId: 'replay-1',
    });

    queue.enqueue(job);

    expect(queue.get('r1')).toEqual(job);
  });

  it('dequeues in FIFO order', () => {
    const queue = new InMemoryJobQueue();
    queue.enqueue(pendingJob({ jobId: 'a' }));
    queue.enqueue(pendingJob({ jobId: 'b' }));
    queue.enqueue(pendingJob({ jobId: 'c' }));

    expect(queue.dequeue()?.jobId).toBe('a');
    expect(queue.dequeue()?.jobId).toBe('b');
    expect(queue.dequeue()?.jobId).toBe('c');
    expect(queue.dequeue()).toBeNull();
  });

  it('cancels a pending job and removes it from pending order', () => {
    const queue = new InMemoryJobQueue();
    queue.enqueue(pendingJob({ jobId: 'a' }));
    queue.enqueue(pendingJob({ jobId: 'b' }));

    const cancelled = queue.cancel('a');

    expect(cancelled?.status).toBe(JobStatus.CANCELLED);
    expect(cancelled?.result).toBeUndefined();
    expect(queue.get('a')?.status).toBe(JobStatus.CANCELLED);
    expect(queue.dequeue()?.jobId).toBe('b');
    expect(queue.dequeue()).toBeNull();
  });

  it('cannot cancel running, completed, failed, or cancelled jobs', () => {
    const queue = new InMemoryJobQueue();
    const running = pendingJob({ jobId: 'run', status: JobStatus.RUNNING });
    const completed = pendingJob({
      jobId: 'done',
      status: JobStatus.COMPLETED,
      result: { success: true, message: 'ok' },
    });
    const failed = pendingJob({
      jobId: 'fail',
      status: JobStatus.FAILED,
      result: { success: false, error: 'x' },
    });
    const cancelled = pendingJob({ jobId: 'cx', status: JobStatus.CANCELLED });

    queue.enqueue(running);
    queue.enqueue(completed);
    queue.enqueue(failed);
    queue.enqueue(cancelled);

    expect(queue.cancel('run')).toBeNull();
    expect(queue.cancel('done')).toBeNull();
    expect(queue.cancel('fail')).toBeNull();
    expect(queue.cancel('cx')).toBeNull();
    expect(queue.get('run')?.status).toBe(JobStatus.RUNNING);
    expect(queue.get('done')?.status).toBe(JobStatus.COMPLETED);
    expect(queue.get('fail')?.status).toBe(JobStatus.FAILED);
    expect(queue.get('cx')?.status).toBe(JobStatus.CANCELLED);
  });

  it('returns null when cancelling or getting unknown job', () => {
    const queue = new InMemoryJobQueue();
    expect(queue.cancel('missing')).toBeNull();
    expect(queue.get('missing')).toBeNull();
  });

  it('lists all known jobs without mutating pending order', () => {
    const queue = new InMemoryJobQueue();
    queue.enqueue(pendingJob({ jobId: 'a' }));
    queue.enqueue(pendingJob({ jobId: 'b' }));

    expect(queue.list().map((j) => j.jobId)).toEqual(['a', 'b']);
    expect(queue.dequeue()?.jobId).toBe('a');
    expect(queue.list().map((j) => j.jobId)).toEqual(['a', 'b']);
  });
});
