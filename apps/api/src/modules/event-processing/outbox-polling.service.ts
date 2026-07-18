import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher } from './outbox-dispatcher.service';

const DEFAULT_POLL_INTERVAL_MS = 250;
const DEFAULT_BATCH_SIZE = 100;

/**
 * Nest lifecycle worker for PostgreSQL Outbox delivery (US155).
 * It never acknowledges rows when no durable consumer is registered.
 */
@Injectable()
export class OutboxPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPollingService.name);
  private timer: NodeJS.Timeout | null = null;
  private polling = false;

  constructor(@Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher) {}

  onModuleInit(): void {
    this.dispatcher.start();
    const intervalMs = positiveInteger(
      process.env.OUTBOX_POLL_INTERVAL_MS,
      DEFAULT_POLL_INTERVAL_MS,
    );
    this.timer = setInterval(() => {
      void this.pollOnce();
    }, intervalMs);
    this.timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.dispatcher.stop();
  }

  async pollOnce(nowIso = new Date().toISOString()): Promise<void> {
    if (this.polling || !this.dispatcher.hasConsumers()) return;
    this.polling = true;
    try {
      const batchSize = positiveInteger(process.env.OUTBOX_BATCH_SIZE, DEFAULT_BATCH_SIZE);
      await this.dispatcher.dispatchOnce(nowIso, batchSize);
    } catch (error) {
      this.logger.error(
        'Outbox polling failed; rows remain recoverable',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.polling = false;
    }
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
