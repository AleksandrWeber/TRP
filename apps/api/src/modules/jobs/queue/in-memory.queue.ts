import type { Metrics } from '../../../metrics/metrics';
import { MetricNames } from '../../../metrics/metrics';
import type { Job } from '../job';
import type { JobQueue } from './queue';
import type { QueueEvent } from './queue-event';
import { computeBackoffDelayMs, DEFAULT_RETRY_POLICY, type RetryPolicy } from './retry-policy';
import { JobStatus } from '../job-status';

type PendingEntry = {
  jobId: string;
  availableAt: number;
};

/**
 * In-memory Queue / JobQueue (US070, US110).
 * Supports acknowledge, retry with exponential backoff, DLQ, and structured events.
 * Process-lifetime only — no Redis.
 */
export class InMemoryQueue implements JobQueue {
  private readonly jobs = new Map<string, Job>();
  private readonly pending: PendingEntry[] = [];
  private readonly inFlight = new Set<string>();
  private readonly deadLetters = new Map<string, Job>();
  private readonly attempts = new Map<string, number>();
  private readonly events: QueueEvent[] = [];
  private readonly policy: RetryPolicy;
  private readonly now: () => number;
  private readonly metrics?: Metrics;

  constructor(
    policy: RetryPolicy = DEFAULT_RETRY_POLICY,
    options?: { now?: () => number; metrics?: Metrics },
  ) {
    this.policy = policy;
    this.now = options?.now ?? Date.now;
    this.metrics = options?.metrics;
    this.reportQueueDepth();
  }

  enqueue(job: Job): void {
    this.jobs.set(job.jobId, job);
    this.deadLetters.delete(job.jobId);

    if (job.status === JobStatus.PENDING) {
      this.ensurePending(job.jobId, this.now());
      this.emit('queued', job.jobId, { attempt: this.attempts.get(job.jobId) ?? 0 });
    }

    this.reportQueueDepth();
  }

  dequeue(): Job | null {
    const now = this.now();
    this.pending.sort((a, b) => a.availableAt - b.availableAt);

    while (this.pending.length > 0) {
      const next = this.pending[0];
      if (!next) return null;
      if (next.availableAt > now) return null;

      this.pending.shift();
      const job = this.jobs.get(next.jobId);
      if (!job) continue;
      if (job.status !== JobStatus.PENDING) continue;

      this.inFlight.add(job.jobId);
      this.emit('processing', job.jobId, { attempt: this.attempts.get(job.jobId) ?? 0 });
      this.reportQueueDepth();
      return job;
    }

    return null;
  }

  acknowledge(jobId: string): void {
    this.inFlight.delete(jobId);
    this.removePending(jobId);
    this.emit('completed', jobId, { attempt: this.attempts.get(jobId) ?? 0 });
    this.reportQueueDepth();
  }

  retry(jobId: string, error?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    this.inFlight.delete(jobId);
    const attempt = (this.attempts.get(jobId) ?? 0) + 1;
    this.attempts.set(jobId, attempt);

    this.emit('failed', jobId, { attempt, error });

    if (attempt > this.policy.maxRetries) {
      job.status = JobStatus.FAILED;
      if (!job.completedAt) {
        job.completedAt = new Date().toISOString();
      }
      if (error && !job.result) {
        job.result = { success: false, error };
      } else if (error && job.result && job.result.success === false && !job.result.error) {
        job.result = { success: false, error };
      }

      this.deadLetters.set(jobId, job);
      this.removePending(jobId);
      this.emit('dead-letter', jobId, { attempt, error });
      this.reportQueueDepth();
      return;
    }

    job.status = JobStatus.PENDING;
    delete job.startedAt;
    delete job.completedAt;
    if (error) {
      job.result = { success: false, error };
    }

    const delay = computeBackoffDelayMs(this.policy, attempt);
    this.ensurePending(jobId, this.now() + delay);
    this.reportQueueDepth();
  }

  cancel(jobId: string): Job | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (job.status !== JobStatus.PENDING) return null;

    job.status = JobStatus.CANCELLED;
    delete job.result;
    this.removePending(jobId);
    this.inFlight.delete(jobId);
    this.reportQueueDepth();
    return job;
  }

  get(jobId: string): Job | null {
    return this.jobs.get(jobId) ?? null;
  }

  list(): Job[] {
    return Array.from(this.jobs.values());
  }

  listDeadLetters(): Job[] {
    return Array.from(this.deadLetters.values());
  }

  getEvents(): readonly QueueEvent[] {
    return this.events;
  }

  private ensurePending(jobId: string, availableAt: number): void {
    this.removePending(jobId);
    this.pending.push({ jobId, availableAt });
  }

  private removePending(jobId: string): void {
    const index = this.pending.findIndex((entry) => entry.jobId === jobId);
    if (index >= 0) {
      this.pending.splice(index, 1);
    }
  }

  private emit(
    type: QueueEvent['type'],
    messageId: string,
    extra?: { attempt?: number; error?: string },
  ): void {
    this.events.push({
      type,
      messageId,
      timestamp: new Date().toISOString(),
      ...(extra?.attempt !== undefined ? { attempt: extra.attempt } : {}),
      ...(extra?.error !== undefined ? { error: extra.error } : {}),
    });
  }

  private reportQueueDepth(): void {
    this.metrics?.gauge(MetricNames.queueDepth, this.pending.length);
  }
}

/** @deprecated Use InMemoryQueue — alias retained for existing imports (US070). */
export { InMemoryQueue as InMemoryJobQueue };
