import type { Job } from './job';
import type { JobQueue } from './job-queue';
import { JobStatus } from './job-status';

/**
 * In-memory FIFO JobQueue (US070).
 * Process-lifetime only — no Redis / BullMQ / RabbitMQ.
 */
export class InMemoryJobQueue implements JobQueue {
  private readonly jobs = new Map<string, Job>();
  private readonly pendingIds: string[] = [];

  enqueue(job: Job): void {
    this.jobs.set(job.jobId, job);
    if (job.status === JobStatus.PENDING && !this.pendingIds.includes(job.jobId)) {
      this.pendingIds.push(job.jobId);
    }
  }

  dequeue(): Job | null {
    while (this.pendingIds.length > 0) {
      const jobId = this.pendingIds.shift();
      if (jobId === undefined) return null;
      const job = this.jobs.get(jobId);
      if (!job) continue;
      if (job.status !== JobStatus.PENDING) continue;
      return job;
    }
    return null;
  }

  cancel(jobId: string): Job | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (job.status !== JobStatus.PENDING) return null;

    job.status = JobStatus.CANCELLED;
    delete job.result;
    this.removePending(jobId);
    return job;
  }

  get(jobId: string): Job | null {
    return this.jobs.get(jobId) ?? null;
  }

  list(): Job[] {
    return Array.from(this.jobs.values());
  }

  private removePending(jobId: string): void {
    const index = this.pendingIds.indexOf(jobId);
    if (index >= 0) {
      this.pendingIds.splice(index, 1);
    }
  }
}
