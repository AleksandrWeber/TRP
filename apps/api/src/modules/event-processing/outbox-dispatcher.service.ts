import type { DurableOutboxConsumer } from './domain/durable-outbox-consumer';
import {
  DEFAULT_OUTBOX_RETRY_POLICY,
  computeOutboxBackoffDelayMs,
  type OutboxRetryPolicy,
} from './domain/outbox-retry-policy';
import { OutboxStatus } from './domain/outbox-status';
import type { OutboxRecord } from './domain/outbox-record';
import type { OutboxRepository } from './repositories/outbox.repository';
import { OutboxDispatcherMetrics } from './outbox-dispatcher.metrics';

export type DispatchOnceResult = Readonly<{
  examined: number;
  published: number;
  retried: number;
  deadLettered: number;
  skippedShutdown: number;
}>;

/**
 * In-process Outbox polling dispatcher (US130 / ADR-013).
 * At-least-once delivery. No global ordering or exactly-once claims.
 * Shutdown stops further dispatch and leaves unpublished events recoverable.
 */
export class OutboxDispatcher {
  private readonly consumers = new Map<string, DurableOutboxConsumer>();
  private readonly metrics: OutboxDispatcherMetrics;
  private readonly policy: OutboxRetryPolicy;
  private running = false;
  private shuttingDown = false;

  constructor(
    private readonly outbox: OutboxRepository,
    options?: {
      policy?: OutboxRetryPolicy;
      metrics?: OutboxDispatcherMetrics;
    },
  ) {
    this.policy = options?.policy ?? DEFAULT_OUTBOX_RETRY_POLICY;
    this.metrics = options?.metrics ?? new OutboxDispatcherMetrics();
  }

  register(consumer: DurableOutboxConsumer): void {
    if (this.consumers.has(consumer.consumerId)) {
      throw new Error(`consumer already registered: ${consumer.consumerId}`);
    }
    this.consumers.set(consumer.consumerId, consumer);
  }

  consumerCount(): number {
    return this.consumers.size;
  }

  hasConsumers(): boolean {
    return this.consumers.size > 0;
  }

  start(): void {
    this.running = true;
    this.shuttingDown = false;
  }

  /**
   * Stop accepting new dispatch work. Pending/unpublished rows remain recoverable.
   */
  async stop(): Promise<void> {
    this.shuttingDown = true;
    this.running = false;
  }

  isRunning(): boolean {
    return this.running && !this.shuttingDown;
  }

  getMetrics(): OutboxDispatcherMetrics {
    return this.metrics;
  }

  async dispatchOnce(
    nowIso: string,
    limit = 100,
    workspaceId?: string,
  ): Promise<DispatchOnceResult> {
    if (this.shuttingDown || !this.running || !this.hasConsumers()) {
      return Object.freeze({
        examined: 0,
        published: 0,
        retried: 0,
        deadLettered: 0,
        skippedShutdown: 0,
      });
    }

    // workspaceId is optional and defaults to a global poll (production behavior).
    // Scoping is used to isolate concurrent integration tests on a shared database.
    const unpublished = await this.outbox.listUnpublished({ readyAt: nowIso, limit, workspaceId });
    let published = 0;
    let retried = 0;
    let deadLettered = 0;
    let skippedShutdown = 0;

    for (const record of unpublished) {
      if (this.shuttingDown) {
        skippedShutdown += 1;
        continue;
      }
      const outcome = await this.deliverOne(record, nowIso);
      if (outcome === 'published') published += 1;
      if (outcome === 'retried') retried += 1;
      if (outcome === 'dead_letter') deadLettered += 1;
    }

    return Object.freeze({
      examined: unpublished.length,
      published,
      retried,
      deadLettered,
      skippedShutdown,
    });
  }

  private async deliverOne(
    record: OutboxRecord,
    nowIso: string,
  ): Promise<'published' | 'retried' | 'dead_letter'> {
    this.metrics.recordAttempt();

    await this.outbox.updateDelivery(record.envelope.eventId, {
      status: OutboxStatus.PUBLISHING,
      updatedAt: nowIso,
    });

    try {
      for (const consumer of this.consumers.values()) {
        await consumer.handle(record.envelope);
      }

      await this.outbox.updateDelivery(record.envelope.eventId, {
        status: OutboxStatus.PUBLISHED,
        attempts: record.attempts + 1,
        lastError: null,
        nextAttemptAt: null,
        publishedAt: nowIso,
        updatedAt: nowIso,
      });
      this.metrics.recordSuccess();
      return 'published';
    } catch (error) {
      const attempts = record.attempts + 1;
      const message = error instanceof Error ? error.message : String(error);
      this.metrics.recordFailure();

      if (attempts >= this.policy.maxAttempts) {
        await this.outbox.updateDelivery(record.envelope.eventId, {
          status: OutboxStatus.DEAD_LETTER,
          attempts,
          lastError: message,
          nextAttemptAt: null,
          updatedAt: nowIso,
        });
        this.metrics.recordDeadLetter();
        return 'dead_letter';
      }

      const delayMs = computeOutboxBackoffDelayMs(this.policy, attempts);
      const nextAttemptAt = new Date(Date.parse(nowIso) + delayMs).toISOString();
      await this.outbox.updateDelivery(record.envelope.eventId, {
        status: OutboxStatus.PENDING,
        attempts,
        lastError: message,
        nextAttemptAt,
        updatedAt: nowIso,
      });
      return 'retried';
    }
  }
}
