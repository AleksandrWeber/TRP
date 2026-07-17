import type { Job } from './job';
import type { JobStatus } from './job-status';

/**
 * Raised when cancel is requested for a non-PENDING job (US073).
 */
export class JobCancelConflictError extends Error {
  readonly job: Job;
  readonly status: JobStatus;

  constructor(job: Job) {
    super(`Job ${job.jobId} is already ${job.status}`);
    this.name = 'JobCancelConflictError';
    this.job = job;
    this.status = job.status;
  }
}
