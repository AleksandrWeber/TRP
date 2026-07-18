import { describe, expect, it, beforeEach } from 'vitest';
import { Timeframe } from '../market-data/timeframe';
import { createClosedCandleEvent } from '../live-market-data/domain/closed-candle-event';
import { OutboxStatus } from './domain/outbox-status';
import { toDurableMarketEnvelope } from './domain/to-durable-market-envelope';
import { OutboxDispatcher } from './outbox-dispatcher.service';
import { OutboxDispatcherMetrics } from './outbox-dispatcher.metrics';
import { InMemoryOutboxRepository } from './repositories/in-memory-outbox.repository';
import { InMemoryTransactionalOutboxWriter } from './repositories/in-memory-transactional-outbox.writer';
import { InMemoryInboxRepository } from './repositories/in-memory-inbox.repository';
import { InMemoryConsumerCheckpointRepository } from './repositories/in-memory-consumer-checkpoint.repository';
import { IdempotentConsumerProcessor } from './idempotent-consumer.processor';
import type { ConsumerProjectionHandler } from './domain/consumer-apply-result';
import type { DurableEventEnvelope } from './domain/durable-event-envelope';

const TIMESTAMPS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

type CountProjection = { count: number };

async function accept(
  writer: InMemoryTransactionalOutboxWriter,
  sequence: number,
  eventId = `evt-${sequence}`,
) {
  const event = createClosedCandleEvent({
    eventId,
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'BTCUSDT',
    sequence,
    timeframe: Timeframe.H1,
    openTime: '2026-07-18T09:00:00.000Z',
    closeTime: '2026-07-18T10:00:00.000Z',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1,
    ...TIMESTAMPS,
  });
  await writer.acceptMarketEvent({
    state: {
      workspaceId: event.workspaceId,
      streamId: String(event.streamId),
      lastSequence: event.sequence,
      lastEventId: String(event.eventId),
      lastOccurredAt: event.occurredAt,
      updatedAt: event.recordedAt,
    },
    envelope: toDurableMarketEnvelope(event),
    recordedAt: event.recordedAt,
  });
  return event;
}

describe('Outbox dispatcher, retry, and dead letters (US130)', () => {
  let outbox: InMemoryOutboxRepository;
  let writer: InMemoryTransactionalOutboxWriter;
  let metrics: OutboxDispatcherMetrics;
  let dispatcher: OutboxDispatcher;

  beforeEach(() => {
    outbox = new InMemoryOutboxRepository();
    writer = new InMemoryTransactionalOutboxWriter(outbox);
    metrics = new OutboxDispatcherMetrics();
    dispatcher = new OutboxDispatcher(outbox, {
      metrics,
      policy: { maxAttempts: 3, baseDelayMs: 1000 },
    });
    dispatcher.start();
  });

  it('delivers at least once and completes after durable consumer acknowledgement', async () => {
    const inbox = new InMemoryInboxRepository();
    const checkpoints = new InMemoryConsumerCheckpointRepository();
    const processor = new IdempotentConsumerProcessor(inbox, checkpoints);
    const projections = new Map<string, CountProjection>();
    const handler: ConsumerProjectionHandler<CountProjection> = {
      consumerId: 'proj-1',
      consumerVersion: '1',
      apply: (_e, current) => ({ count: (current?.count ?? 0) + 1 }),
      getProjection: (ws, stream) => projections.get(`${ws}::${stream}`) ?? null,
      saveProjection: (ws, stream, p) => projections.set(`${ws}::${stream}`, p),
    };

    const event = await accept(writer, 1);
    let handleCount = 0;

    dispatcher.register({
      consumerId: 'proj-1',
      handle: async (envelope: DurableEventEnvelope) => {
        handleCount += 1;
        const result = await processor.process(envelope, handler, '2026-07-18T10:00:01.000Z');
        if (result.outcome !== 'applied' && result.outcome !== 'duplicate') {
          throw new Error(`unexpected outcome: ${result.outcome}`);
        }
      },
    });

    const first = await dispatcher.dispatchOnce('2026-07-18T10:00:01.000Z');
    expect(first.published).toBe(1);
    expect(handleCount).toBe(1);
    expect((await outbox.findByEventId(event.eventId))?.status).toBe(OutboxStatus.PUBLISHED);

    // Simulate at-least-once redelivery after ack loss: reset to pending and re-dispatch.
    await outbox.updateDelivery(event.eventId, {
      status: OutboxStatus.PENDING,
      publishedAt: null,
      updatedAt: '2026-07-18T10:00:02.000Z',
    });
    const second = await dispatcher.dispatchOnce('2026-07-18T10:00:02.000Z');
    expect(second.published).toBe(1);
    expect(handleCount).toBe(2);
    expect(projections.size).toBe(1);
    expect([...projections.values()][0]).toEqual({ count: 1 });
  });

  it('keeps failed delivery pending/retryable and dead-letters after exhaustion', async () => {
    await accept(writer, 1, 'fail-1');
    let attempts = 0;
    dispatcher.register({
      consumerId: 'flaky',
      handle: async () => {
        attempts += 1;
        throw new Error('handler failed');
      },
    });

    const t0 = await dispatcher.dispatchOnce('2026-07-18T10:00:00.000Z');
    expect(t0.retried).toBe(1);
    let row = await outbox.findByEventId('fail-1');
    expect(row?.status).toBe(OutboxStatus.PENDING);
    expect(row?.attempts).toBe(1);
    expect(row?.nextAttemptAt).toBe('2026-07-18T10:00:01.000Z');

    // Not ready yet
    const early = await dispatcher.dispatchOnce('2026-07-18T10:00:00.500Z');
    expect(early.examined).toBe(0);

    const t1 = await dispatcher.dispatchOnce('2026-07-18T10:00:01.000Z');
    expect(t1.retried).toBe(1);
    row = await outbox.findByEventId('fail-1');
    expect(row?.attempts).toBe(2);

    const t2 = await dispatcher.dispatchOnce(row!.nextAttemptAt!);
    expect(t2.deadLettered).toBe(1);
    row = await outbox.findByEventId('fail-1');
    expect(row?.status).toBe(OutboxStatus.DEAD_LETTER);
    expect(row?.attempts).toBe(3);
    expect(attempts).toBe(3);
    expect(metrics.snapshot().deadLetters).toBe(1);
  });

  it('does not claim global ordering — independent streams dispatch independently', async () => {
    await accept(writer, 1, 'btc-1');
    const eth = createClosedCandleEvent({
      eventId: 'eth-1',
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'ETHUSDT',
      sequence: 1,
      timeframe: Timeframe.H1,
      openTime: '2026-07-18T09:00:00.000Z',
      closeTime: '2026-07-18T10:00:00.000Z',
      open: 1,
      high: 2,
      low: 1,
      close: 1.5,
      volume: 1,
      ...TIMESTAMPS,
    });
    await writer.acceptMarketEvent({
      state: {
        workspaceId: eth.workspaceId,
        streamId: String(eth.streamId),
        lastSequence: eth.sequence,
        lastEventId: String(eth.eventId),
        lastOccurredAt: eth.occurredAt,
        updatedAt: eth.recordedAt,
      },
      envelope: toDurableMarketEnvelope(eth),
      recordedAt: eth.recordedAt,
    });

    const seen: string[] = [];
    dispatcher.register({
      consumerId: 'observer',
      handle: async (envelope) => {
        seen.push(String(envelope.eventId));
      },
    });

    await dispatcher.dispatchOnce('2026-07-18T10:00:01.000Z');
    expect(seen.sort()).toEqual(['btc-1', 'eth-1']);
    // Documented: no global ordering guarantee across streams beyond per-stream sort.
    expect(seen.length).toBe(2);
  });

  it('shutdown leaves unpublished events recoverable', async () => {
    await accept(writer, 1, 'pending-1');
    dispatcher.register({
      consumerId: 'slow',
      handle: async () => undefined,
    });

    await dispatcher.stop();
    const whileStopped = await dispatcher.dispatchOnce('2026-07-18T10:00:01.000Z');
    expect(whileStopped.examined).toBe(0);
    expect((await outbox.findByEventId('pending-1'))?.status).toBe(OutboxStatus.PENDING);

    dispatcher.start();
    const afterRestart = await dispatcher.dispatchOnce('2026-07-18T10:00:02.000Z');
    expect(afterRestart.published).toBe(1);
    expect((await outbox.findByEventId('pending-1'))?.status).toBe(OutboxStatus.PUBLISHED);
  });
});
