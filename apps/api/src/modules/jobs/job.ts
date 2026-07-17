import type { JobMetadata } from './job-metadata';
import type { JobResult } from './job-result';
import type { JobStatus } from './job-status';
import type { JobType } from './job-type';

/**
 * Asynchronous Campaign / Replay Job domain entity (US069–US072).
 * Status API exposes this shape read-only via GET /jobs.
 */
export type Job = {
  jobId: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: JobStatus;
  type: JobType;
  sourceSessionId?: string;
  replayId?: string;
  metadata: JobMetadata;
  result?: JobResult;
};
