import { describe, expect, it, beforeEach } from 'vitest';
import { Timeframe } from '../market-data/timeframe';
import { createClosedCandleEvent } from '../live-market-data/domain/closed-candle-event';
import { ConsumerCheckpointStatus } from './domain/consumer-checkpoint';
import type { ConsumerProjectionHandler } from './domain/consumer-apply-result';
import type { DurableEventEnvelope } from './domain/durable-event-envelope';
import { toDurableMarketEnvelope } from './domain/to-durable-market-envelope';
import { IdempotentConsumerProcessor } from './idempotent-consumer.processor';
import { InMemoryConsumerCheckpointRepository } from './repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryInboxRepository } from './repositories/in-memory-inbox.repository';
import type { ConsumerCheckpointRepository } from './repositories/consumer-checkpoint.repository';

const TIMESTAMPS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

type CountProjection = { count: number; lastClose: number };

function envelope(sequence: number, eventId = `evt-${sequence}`): DurableEventEnvelope {
  return toDurableMarketEnvelope(
    createClosedCandleEvent({
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
      close: 100 + sequence,
      volume: 1,
      ...TIMESTAMPS,
    }),
  );
}

function createHandler(
  store: Map<string, CountProjection>,
): ConsumerProjectionHandler<CountProjection> {
  return {
    consumerId: 'market-projection-v1',
    consumerVersion: '1.0.0',
    apply(event, current) {
      const close = Number((event.payload as { close: number }).close);
      return {
        count: (current?.count ?? 0) + 1,
        lastClose: close,
      };
    },
    getProjection(workspaceId, streamId) {
      return store.get(`${workspaceId}::${streamId}`) ?? null;
    },
    saveProjection(workspaceId, streamId, projection) {
      store.set(`${workspaceId}::${streamId}`, projection);
    },
    clearProjection(workspaceId, streamId) {
      store.delete(`${workspaceId}::${streamId}`);
    },
  };
}

describe('Consumer Inbox and Checkpoints (US129)', () => {
  let inbox: InMemoryInboxRepository;
  let checkpoints: InMemoryConsumerCheckpointRepository;
  let processor: IdempotentConsumerProcessor;
  let projections: Map<string, CountProjection>;
  let handler: ConsumerProjectionHandler<CountProjection>;

  beforeEach(() => {
    inbox = new InMemoryInboxRepository();
    checkpoints = new InMemoryConsumerCheckpointRepository();
    processor = new IdempotentConsumerProcessor(inbox, checkpoints);
    projections = new Map();
    handler = createHandler(projections);
  });

  it('applies Inbox + projection + checkpoint atomically', async () => {
    const event = envelope(1);
    const result = await processor.process(event, handler, '2026-07-18T10:00:01.000Z');

    expect(result.outcome).toBe('applied');
    if (result.outcome !== 'applied') return;

    expect(result.inbox.consumerId).toBe('market-projection-v1');
    expect(result.inbox.eventId).toBe(event.eventId);
    expect(result.checkpoint.lastAppliedSequence).toBe(1);
    expect(result.checkpoint.status).toBe(ConsumerCheckpointStatus.READY);
    expect(result.projection).toEqual({ count: 1, lastClose: 101 });
    expect(await inbox.find(handler.consumerId, event.eventId)).not.toBeNull();
  });

  it('treats duplicate delivery as a successful no-op', async () => {
    const event = envelope(1);
    await processor.process(event, handler, '2026-07-18T10:00:01.000Z');
    const duplicate = await processor.process(event, handler, '2026-07-18T10:00:02.000Z');

    expect(duplicate.outcome).toBe('duplicate');
    expect(projections.size).toBe(1);
    expect([...projections.values()][0]).toEqual({ count: 1, lastClose: 101 });
  });

  it('enforces unique consumerId + eventId', async () => {
    const event = envelope(1);
    await inbox.insert({
      consumerId: handler.consumerId as never,
      eventId: event.eventId,
      consumerVersion: '1.0.0',
      processedAt: '2026-07-18T10:00:00.000Z',
    });

    await expect(
      inbox.insert({
        consumerId: handler.consumerId as never,
        eventId: event.eventId,
        consumerVersion: '1.0.0',
        processedAt: '2026-07-18T10:00:01.000Z',
      }),
    ).rejects.toThrow(/inbox record already exists/);
  });

  it('defers a future sequence when its predecessor is missing', async () => {
    const gap = await processor.process(envelope(2), handler, '2026-07-18T10:00:01.000Z');

    expect(gap.outcome).toBe('deferred_gap');
    if (gap.outcome !== 'deferred_gap') return;
    expect(gap.expectedSequence).toBe(1);
    expect(gap.receivedSequence).toBe(2);
    expect(gap.checkpoint.status).toBe(ConsumerCheckpointStatus.BLOCKED_GAP);
    expect(gap.checkpoint.blockedSequence).toBe(2);
    expect(projections.size).toBe(0);
    expect(await inbox.find(handler.consumerId, envelope(2).eventId)).toBeNull();
  });

  it('survives restart from durable checkpoints', async () => {
    const event = envelope(1);
    await processor.process(event, handler, '2026-07-18T10:00:01.000Z');

    const restoredCheckpoints = checkpoints.clone();
    const restoredProcessor = new IdempotentConsumerProcessor(inbox, restoredCheckpoints);
    const afterRestart = await restoredCheckpoints.get(handler.consumerId, event.aggregateId);

    expect(afterRestart?.lastAppliedSequence).toBe(1);
    expect(afterRestart?.lastAppliedEventId).toBe(String(event.eventId));

    const next = await restoredProcessor.process(envelope(2), handler, '2026-07-18T10:00:02.000Z');
    expect(next.outcome).toBe('applied');
    if (next.outcome !== 'applied') return;
    expect(next.checkpoint.lastAppliedSequence).toBe(2);
    expect(next.projection).toEqual({ count: 2, lastClose: 102 });
  });

  it('rolls back Inbox and projection when checkpoint write fails', async () => {
    const event = envelope(1);
    const failingCheckpoints: ConsumerCheckpointRepository = {
      get: (consumerId, streamId) => checkpoints.get(consumerId, streamId),
      listByConsumer: (consumerId) => checkpoints.listByConsumer(consumerId),
      save: async () => {
        throw new Error('checkpoint write failed');
      },
    };

    const failingProcessor = new IdempotentConsumerProcessor(inbox, failingCheckpoints);

    await expect(
      failingProcessor.process(event, handler, '2026-07-18T10:00:01.000Z'),
    ).rejects.toThrow(/checkpoint write failed/);

    expect(await inbox.find(handler.consumerId, event.eventId)).toBeNull();
    expect(projections.size).toBe(0);
  });
});
