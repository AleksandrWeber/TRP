import { Queue as BullQueue, type ConnectionOptions } from 'bullmq';
import type { Metrics } from '../../../metrics/metrics';
import type { Job } from '../job';
import { JobStatus } from '../job-status';
import { InMemoryQueue } from './in-memory.queue';
import type { JobQueue } from './queue';
import type { QueueEvent } from './queue-event';
import { DEFAULT_RETRY_POLICY, type RetryPolicy } from './retry-policy';

export type BullMQQueueOptions = {
  name?: string;
  connection?: ConnectionOptions;
  /** Injected BullMQ Queue — for tests / custom wiring. */
  bullQueue?: BullQueue;
  retryPolicy?: RetryPolicy;
  metrics?: Metrics;
};

/**
 * BullMQ-backed JobQueue (US110).
 * BullMQ-specific types stay inside this adapter.
 * Sync JobQueue semantics are preserved via an in-process registry so
 * BackgroundJobRunner / JobService behavior stays unchanged; BullMQ mirrors
 * durable enqueue + retry/DLQ configuration for production workers.
 */
export class BullMQQueue implements JobQueue {
  private readonly local: InMemoryQueue;
  private readonly bull: BullQueue;
  private readonly ownsBull: boolean;

  constructor(options: BullMQQueueOptions = {}) {
    const policy = options.retryPolicy ?? DEFAULT_RETRY_POLICY;
    this.local = new InMemoryQueue(policy, { metrics: options.metrics });

    if (options.bullQueue) {
      this.bull = options.bullQueue;
      this.ownsBull = false;
    } else {
      const connection = options.connection ?? resolveRedisConnection();
      this.bull = new BullQueue(options.name ?? 'trp-jobs', {
        connection,
        defaultJobOptions: {
          attempts: policy.maxRetries + 1,
          backoff: {
            type: 'exponential',
            delay: policy.baseDelayMs,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      });
      this.ownsBull = true;
    }
  }

  enqueue(job: Job): void {
    this.local.enqueue(job);
    if (job.status === JobStatus.PENDING) {
      void this.bull.add(
        job.type,
        { jobId: job.jobId },
        {
          jobId: job.jobId,
        },
      );
    }
  }

  dequeue(): Job | null {
    return this.local.dequeue();
  }

  acknowledge(jobId: string): void {
    this.local.acknowledge(jobId);
    void this.bull.getJob(jobId).then((bullJob) => bullJob?.moveToCompleted('ok', jobId, false));
  }

  retry(jobId: string, error?: string): void {
    this.local.retry(jobId, error);
    const job = this.local.get(jobId);
    if (!job) return;

    if (job.status === JobStatus.FAILED) {
      void this.bull
        .getJob(jobId)
        .then((bullJob) => bullJob?.moveToFailed(new Error(error ?? 'failed'), jobId, false));
      return;
    }

    // Re-queued locally with backoff — refresh BullMQ job for durable pending state.
    void this.bull.add(
      job.type,
      { jobId: job.jobId },
      {
        jobId: `${job.jobId}:${Date.now()}`,
        delay: 0,
      },
    );
  }

  cancel(jobId: string): Job | null {
    const cancelled = this.local.cancel(jobId);
    if (cancelled) {
      void this.bull.getJob(jobId).then((bullJob) => bullJob?.remove());
    }
    return cancelled;
  }

  get(jobId: string): Job | null {
    return this.local.get(jobId);
  }

  list(): Job[] {
    return this.local.list();
  }

  listDeadLetters(): Job[] {
    return this.local.listDeadLetters();
  }

  getEvents(): readonly QueueEvent[] {
    return this.local.getEvents();
  }

  async close(): Promise<void> {
    if (this.ownsBull) {
      await this.bull.close();
    }
  }
}

function resolveRedisConnection(): ConnectionOptions {
  const url = process.env.QUEUE_REDIS_URL ?? process.env.REDIS_URL;
  if (url) {
    return { url } as ConnectionOptions;
  }
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
  };
}
