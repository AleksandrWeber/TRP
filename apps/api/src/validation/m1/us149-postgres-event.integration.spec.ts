/**
 * US149 — PostgreSQL Outbox/Inbox/checkpoint integration validation.
 */
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Timeframe } from '../../modules/market-data/timeframe';
import { createClosedCandleEvent } from '../../modules/live-market-data/domain/closed-candle-event';
import { MarketHealthStatus } from '../../modules/live-market-data/domain/market-status';
import { MarketCheckpointStore } from '../../modules/live-market-data/checkpoints/market-checkpoint-store';
import { PrismaMarketCheckpointPersistence } from '../../modules/live-market-data/checkpoints/prisma-market-checkpoint.persistence';
import { IdempotentConsumerProcessor } from '../../modules/event-processing/idempotent-consumer.processor';
import { toDurableMarketEnvelope } from '../../modules/event-processing/domain/to-durable-market-envelope';
import { ConsumerCheckpointStatus } from '../../modules/event-processing/domain/consumer-checkpoint';
import { toConsumerId } from '../../modules/event-processing/domain/consumer-id';
import { OutboxStatus } from '../../modules/event-processing/domain/outbox-status';
import { OutboxDispatcher } from '../../modules/event-processing/outbox-dispatcher.service';
import { PrismaOutboxRepository } from '../../modules/event-processing/repositories/prisma-outbox.repository';
import { PrismaInboxRepository } from '../../modules/event-processing/repositories/prisma-inbox.repository';
import { PrismaConsumerCheckpointRepository } from '../../modules/event-processing/repositories/prisma-consumer-checkpoint.repository';
import { PrismaTransactionalOutboxWriter } from '../../modules/event-processing/repositories/prisma-transactional-outbox.writer';

const WS = 'ws-us149';
const PREFIX = `m1-us149-${Date.now()}`;

const TIMESTAMPS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

function candle(sequence: number, eventId: string) {
  return createClosedCandleEvent({
    eventId,
    workspaceId: WS,
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
}

describe('US149 — PostgreSQL event integration', () => {
  const prisma = new PrismaClient();
  let outbox: PrismaOutboxRepository;
  let inbox: PrismaInboxRepository;
  let checkpoints: PrismaConsumerCheckpointRepository;
  let writer: PrismaTransactionalOutboxWriter;
  let marketCheckpoints: MarketCheckpointStore;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanup();
    outbox = new PrismaOutboxRepository(prisma);
    inbox = new PrismaInboxRepository(prisma);
    checkpoints = new PrismaConsumerCheckpointRepository(prisma);
    writer = new PrismaTransactionalOutboxWriter(prisma);
    marketCheckpoints = new MarketCheckpointStore(new PrismaMarketCheckpointPersistence(prisma));
  });

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({ where: { consumerId: { startsWith: 'm1-us149-' } } });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: { startsWith: 'm1-us149-' } },
    });
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.marketStreamCheckpointRecord.deleteMany({ where: { workspaceId: WS } });
  }

  it('rolls back so no orphan Outbox event remains', async () => {
    const event = candle(1, `${PREFIX}-orphan`);
    const envelope = toDurableMarketEnvelope(event);

    await expect(
      writer.acceptMarketEventOrRollback(
        {
          state: {
            workspaceId: WS,
            streamId: String(event.streamId),
            lastSequence: 1,
            lastEventId: String(event.eventId),
            lastOccurredAt: event.occurredAt,
            updatedAt: event.recordedAt,
          },
          envelope,
          recordedAt: event.recordedAt,
        },
        () => {
          throw new Error('forced failure after outbox insert');
        },
      ),
    ).rejects.toThrow(/forced failure/);

    expect(await outbox.findByEventId(event.eventId)).toBeNull();
  });

  it('duplicate delivery causes one projection effect', async () => {
    const event = candle(1, `${PREFIX}-dup`);
    const envelope = toDurableMarketEnvelope(event);
    await writer.acceptMarketEvent({
      state: {
        workspaceId: WS,
        streamId: String(event.streamId),
        lastSequence: 1,
        lastEventId: String(event.eventId),
        lastOccurredAt: event.occurredAt,
        updatedAt: event.recordedAt,
      },
      envelope,
      recordedAt: event.recordedAt,
    });

    const processor = new IdempotentConsumerProcessor(inbox, checkpoints);
    let applyCount = 0;
    const handler = {
      consumerId: `${PREFIX}-consumer`,
      consumerVersion: '1',
      apply: () => {
        applyCount += 1;
        return { n: applyCount };
      },
      getProjection: () => null as { n: number } | null,
      saveProjection: () => undefined,
      clearProjection: () => undefined,
    };

    const first = await processor.process(envelope, handler, event.processedAt);
    const second = await processor.process(envelope, handler, event.processedAt);
    expect(first.outcome).toBe('applied');
    expect(second.outcome).toBe('duplicate');
    expect(applyCount).toBe(1);
  });

  it('rejects concurrent checkpoint regression', async () => {
    const event1 = candle(1, `${PREFIX}-cp1`);
    const event2 = candle(2, `${PREFIX}-cp2`);
    await marketCheckpoints.advance({
      event: event1,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: event1.recordedAt,
      eventDurablyRecorded: true,
    });

    await expect(
      marketCheckpoints.advance({
        event: event1,
        health: MarketHealthStatus.HEALTHY,
        updatedAt: event1.recordedAt,
        eventDurablyRecorded: true,
      }),
    ).rejects.toThrow(/regression/);

    const advanced = await marketCheckpoints.advance({
      event: event2,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: event2.recordedAt,
      eventDurablyRecorded: true,
    });
    expect(advanced.lastSequence).toBe(2);
  });

  it('failed consumers remain recoverable via retry then dead-letter', async () => {
    const event = candle(1, `${PREFIX}-dlq`);
    const envelope = toDurableMarketEnvelope(event);
    await outbox.insert(envelope, event.recordedAt);

    const dispatcher = new OutboxDispatcher(outbox, {
      policy: { maxAttempts: 2, baseDelayMs: 1 },
    });
    dispatcher.start();
    dispatcher.register({
      consumerId: `${PREFIX}-failing`,
      handle: async () => {
        throw new Error('consumer boom');
      },
    });

    await dispatcher.dispatchOnce('2026-07-18T10:00:01.000Z');
    let row = await outbox.findByEventId(event.eventId);
    expect(row?.status).toBe(OutboxStatus.PENDING);
    expect(row?.attempts).toBe(1);

    await dispatcher.dispatchOnce('2026-07-18T10:00:02.000Z');
    row = await outbox.findByEventId(event.eventId);
    expect(row?.status).toBe(OutboxStatus.DEAD_LETTER);

    const event2 = candle(2, `${PREFIX}-ok`);
    await outbox.insert(toDurableMarketEnvelope(event2), event2.recordedAt);
    const freshClient = new PrismaClient();
    const restarted = new OutboxDispatcher(new PrismaOutboxRepository(freshClient), {
      policy: { maxAttempts: 3, baseDelayMs: 1 },
    });
    restarted.start();
    let delivered = 0;
    restarted.register({
      consumerId: `${PREFIX}-ok-consumer`,
      handle: async () => {
        delivered += 1;
      },
    });
    await restarted.dispatchOnce('2026-07-18T10:00:03.000Z');
    expect(delivered).toBe(1);
    await restarted.stop();
    await dispatcher.stop();
    await freshClient.$disconnect();
  });

  it('restart resumes pending Outbox and consumer checkpoints', async () => {
    const event = candle(1, `${PREFIX}-restart`);
    const envelope = toDurableMarketEnvelope(event);
    await writer.acceptMarketEvent({
      state: {
        workspaceId: WS,
        streamId: String(event.streamId),
        lastSequence: 1,
        lastEventId: String(event.eventId),
        lastOccurredAt: event.occurredAt,
        updatedAt: event.recordedAt,
      },
      envelope,
      recordedAt: event.recordedAt,
    });

    await checkpoints.save({
      consumerId: toConsumerId(`${PREFIX}-restart-c`),
      consumerVersion: '1',
      streamId: String(event.streamId),
      workspaceId: WS,
      lastAppliedSequence: 1,
      lastAppliedEventId: String(event.eventId),
      status: ConsumerCheckpointStatus.READY,
      blockedSequence: null,
      lastError: null,
      updatedAt: event.recordedAt,
    });

    const fresh = new PrismaClient();
    const freshOutbox = new PrismaOutboxRepository(fresh);
    const freshCheckpoints = new PrismaConsumerCheckpointRepository(fresh);
    const pending = await freshOutbox.listUnpublished({ workspaceId: WS });
    expect(pending.some((row) => String(row.envelope.eventId) === String(event.eventId))).toBe(
      true,
    );
    const cp = await freshCheckpoints.get(`${PREFIX}-restart-c`, String(event.streamId));
    expect(cp?.lastAppliedSequence).toBe(1);
    await fresh.$disconnect();
  });
});
