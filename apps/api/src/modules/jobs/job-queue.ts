import type { Job } from './job';

/**
 * Queue abstraction for asynchronous Jobs (US070–US073).
 * Implementations must not leak into JobService — inject via JOB_QUEUE token.
 */
export interface JobQueue {
  enqueue(job: Job): void;
  dequeue(): Job | null;
  /**
   * Cancel a PENDING job → CANCELLED.
   * Returns null if missing or not PENDING (RUNNING/COMPLETED/FAILED/CANCELLED).
   */
  cancel(jobId: string): Job | null;
  get(jobId: string): Job | null;
  /** All known jobs (any status), newest-last / insertion order. */
  list(): Job[];
}
