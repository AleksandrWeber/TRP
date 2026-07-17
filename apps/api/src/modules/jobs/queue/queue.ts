import type { Job } from '../job';
import type { QueueEvent } from './queue-event';

/**
 * Production Queue abstraction (US110).
 * BullMQ and InMemory both implement this — no BullMQ types leak to callers.
 */
export interface Queue {
  enqueue(job: Job): void;
  dequeue(): Job | null;
  /** Mark a dequeued/processing message as successfully completed. */
  acknowledge(jobId: string): void;
  /**
   * Record a failure and either re-queue with exponential backoff
   * or move the message to the dead-letter queue when maxRetries is exceeded.
   */
  retry(jobId: string, error?: string): void;
}

/**
 * Job-facing queue port (US070 + US110).
 * Extends Queue with Job registry / cancel / DLQ inspection helpers.
 */
export interface JobQueue extends Queue {
  cancel(jobId: string): Job | null;
  get(jobId: string): Job | null;
  list(): Job[];
  /** Messages that exhausted retries (dead-letter queue). */
  listDeadLetters(): Job[];
  /** Structured queue events (newest last). */
  getEvents(): readonly QueueEvent[];
}
