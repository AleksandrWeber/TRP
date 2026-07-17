import type { Job } from './job';

/**
 * Processes queued Jobs asynchronously (US071).
 * Implementations must not persist jobs or write History.
 */
export interface JobRunner {
  processNext(): Promise<Job | null>;
  process(jobId: string): Promise<Job | null>;
}
