import { describe, expect, it, vi } from 'vitest';
import type { Job } from '../job';
import { JobStatus } from '../job-status';
import { JobType } from '../job-type';
import { BullMQQueue } from './bullmq.queue';
import { InMemoryQueue } from './in-memory.queue';
import { computeBackoffDelayMs, resolveRetryPolicy } from './retry-policy';

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

describe('Queue hardening (US110)', () => {
  it('emits queued → processing → completed on acknowledge', () => {
    const queue = new InMemoryQueue();
    const job = pendingJob({ jobId: 'j1' });

    queue.enqueue(job);
    expect(queue.dequeue()?.jobId).toBe('j1');
    job.status = JobStatus.COMPLETED;
    queue.acknowledge('j1');

    expect(queue.getEvents().map((event) => event.type)).toEqual([
      'queued',
      'processing',
      'completed',
    ]);
  });

  it('moves message to DLQ when maxRetries is exceeded', () => {
    const queue = new InMemoryQueue({ maxRetries: 0, baseDelayMs: 0 });
    const job = pendingJob({ jobId: 'j-dlq' });
    queue.enqueue(job);
    queue.dequeue();

    job.result = { success: false, error: 'boom' };
    queue.retry('j-dlq', 'boom');

    expect(job.status).toBe(JobStatus.FAILED);
    expect(queue.listDeadLetters().map((item) => item.jobId)).toEqual(['j-dlq']);
    expect(queue.dequeue()).toBeNull();
    expect(queue.getEvents().map((event) => event.type)).toEqual([
      'queued',
      'processing',
      'failed',
      'dead-letter',
    ]);
  });

  it('retries with exponential backoff before DLQ', () => {
    let now = 1_000;
    const queue = new InMemoryQueue({ maxRetries: 2, baseDelayMs: 100 }, { now: () => now });
    const job = pendingJob({ jobId: 'j-retry' });
    queue.enqueue(job);

    expect(queue.dequeue()?.jobId).toBe('j-retry');
    queue.retry('j-retry', 'fail-1');
    expect(job.status).toBe(JobStatus.PENDING);
    expect(queue.listDeadLetters()).toEqual([]);

    // Backoff: 100 * 2^0 = 100 → available at 1100
    expect(queue.dequeue()).toBeNull();
    now = 1_100;
    expect(queue.dequeue()?.jobId).toBe('j-retry');
    queue.retry('j-retry', 'fail-2');

    // Backoff: 100 * 2^1 = 200 → available at 1300
    now = 1_300;
    expect(queue.dequeue()?.jobId).toBe('j-retry');
    queue.retry('j-retry', 'fail-3');

    expect(job.status).toBe(JobStatus.FAILED);
    expect(queue.listDeadLetters().map((item) => item.jobId)).toEqual(['j-retry']);
    expect(computeBackoffDelayMs({ maxRetries: 2, baseDelayMs: 100 }, 1)).toBe(100);
    expect(computeBackoffDelayMs({ maxRetries: 2, baseDelayMs: 100 }, 2)).toBe(200);
  });

  it('resolveRetryPolicy reads env with defaults', () => {
    expect(resolveRetryPolicy(() => undefined)).toEqual({ maxRetries: 0, baseDelayMs: 1000 });
    expect(
      resolveRetryPolicy((key) => {
        if (key === 'QUEUE_MAX_RETRIES') return '3';
        if (key === 'QUEUE_BACKOFF_BASE_MS') return '250';
        return undefined;
      }),
    ).toEqual({ maxRetries: 3, baseDelayMs: 250 });
  });

  it('BullMQQueue mirrors enqueue to BullMQ and keeps JobQueue sync API', () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const getJob = vi.fn().mockResolvedValue(null);
    const bullQueue = { add, getJob } as never;

    const queue = new BullMQQueue({
      bullQueue,
      retryPolicy: { maxRetries: 0, baseDelayMs: 0 },
    });

    const job = pendingJob({ jobId: 'bull-1' });
    queue.enqueue(job);

    expect(add).toHaveBeenCalledWith(JobType.CAMPAIGN, { jobId: 'bull-1' }, { jobId: 'bull-1' });
    expect(queue.dequeue()?.jobId).toBe('bull-1');
    queue.acknowledge('bull-1');
    expect(queue.get('bull-1')?.jobId).toBe('bull-1');
  });
});
