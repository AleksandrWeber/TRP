import { describe, expect, it, beforeEach } from 'vitest';
import { Timeframe } from '../market-data/timeframe';
import { createClosedCandleEvent } from '../live-market-data/domain/closed-candle-event';
import { OutboxStatus } from './domain/outbox-status';
import { toDurableMarketEnvelope } from './domain/to-durable-market-envelope';
import { InMemoryOutboxRepository } from './repositories/in-memory-outbox.repository';
import { InMemoryTransactionalOutboxWriter } from './repositories/in-memory-transactional-outbox.writer';

const TIMESTAMPS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

function candle(sequence: number, eventId = `evt-${sequence}`) {
  return createClosedCandleEvent({
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
}

describe('Transactional Outbox persistence (US128)', () => {
  let outbox: InMemoryOutboxRepository;
  let writer: InMemoryTransactionalOutboxWriter;

  beforeEach(() => {
    outbox = new InMemoryOutboxRepository();
    writer = new InMemoryTransactionalOutboxWriter(outbox);
  });

  it('commits accepted market state and Outbox event atomically', async () => {
    const event = candle(1);
    const envelope = toDurableMarketEnvelope(event);

    const result = await writer.acceptMarketEvent({
      state: {
        workspaceId: event.workspaceId,
        streamId: String(event.streamId),
        lastSequence: event.sequence,
        lastEventId: String(event.eventId),
        lastOccurredAt: event.occurredAt,
        updatedAt: event.recordedAt,
      },
      envelope,
      recordedAt: event.recordedAt,
    });

    expect(result.outbox.status).toBe(OutboxStatus.PENDING);
    expect(result.outbox.envelope.eventId).toBe(event.eventId);
    expect(result.outbox.envelope.aggregateType).toBe('MarketStream');
    expect(result.outbox.envelope.aggregateId).toBe(event.streamId);
    expect(result.outbox.envelope.aggregateVersion).toBe(1);
    expect(result.outbox.envelope.schemaVersion).toBe(1);
    expect(result.outbox.envelope.workspaceId).toBe('ws-1');
    expect(result.outbox.envelope.occurredAt).toBe(event.occurredAt);
    expect(result.outbox.envelope.recordedAt).toBe(event.recordedAt);
    expect(result.outbox.envelope.payload).toBeDefined();

    const state = await writer.getAcceptedState('ws-1', String(event.streamId));
    expect(state?.lastSequence).toBe(1);
    expect(await outbox.findByEventId(event.eventId)).not.toBeNull();
  });

  it('persists neither state nor event when the transaction fails', async () => {
    const event = candle(2);

    await expect(
      writer.acceptMarketEventOrRollback(
        {
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
        },
        () => {
          throw new Error('simulated commit failure');
        },
      ),
    ).rejects.toThrow(/simulated commit failure/);

    expect(await writer.getAcceptedState('ws-1', String(event.streamId))).toBeNull();
    expect(await outbox.findByEventId(event.eventId)).toBeNull();
  });

  it('keeps Outbox envelope immutable while allowing delivery metadata updates', async () => {
    const event = candle(3);
    const { outbox: record } = await writer.acceptMarketEvent({
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

    expect(() => {
      (record.envelope as { eventType: string }).eventType = 'Mutated';
    }).toThrow();
    expect(() => {
      (record.envelope.payload as { close: number }).close = 0;
    }).toThrow();

    const updated = await outbox.updateDelivery(event.eventId, {
      status: OutboxStatus.PUBLISHING,
      attempts: 1,
      lastError: 'temporary',
      nextAttemptAt: '2026-07-18T10:01:00.000Z',
      updatedAt: '2026-07-18T10:00:30.000Z',
    });

    expect(updated.status).toBe(OutboxStatus.PUBLISHING);
    expect(updated.attempts).toBe(1);
    expect(updated.envelope.eventType).toBe('MarketClosedCandle');
    expect(updated.envelope.payload).toMatchObject({ close: 105 });
  });

  it('lists unpublished events ordered by aggregate stream then version', async () => {
    const a1 = candle(1, 'a-1');
    const a2 = candle(2, 'a-2');
    // Different stream (mark) via streamId override on envelope aggregate
    const mark = createClosedCandleEvent({
      eventId: 'b-1',
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

    for (const event of [a2, mark, a1]) {
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
    }

    const unpublished = await outbox.listUnpublished({ workspaceId: 'ws-1' });
    expect(unpublished.map((row) => row.envelope.eventId)).toEqual(['a-1', 'a-2', 'b-1']);
    expect(unpublished.every((row) => row.status === OutboxStatus.PENDING)).toBe(true);
  });

  it('requires full ADR-013 envelope fields', async () => {
    const event = candle(4);
    const envelope = toDurableMarketEnvelope(event);
    const incomplete = { ...envelope, correlationId: undefined };
    // remove required field
    const broken = {
      ...incomplete,
      aggregateType: '',
    };

    await expect(
      writer.acceptMarketEvent({
        state: {
          workspaceId: event.workspaceId,
          streamId: String(event.streamId),
          lastSequence: event.sequence,
          lastEventId: String(event.eventId),
          lastOccurredAt: event.occurredAt,
          updatedAt: event.recordedAt,
        },
        envelope: broken,
        recordedAt: event.recordedAt,
      }),
    ).rejects.toThrow(/durable envelope missing required field: aggregateType/);
  });
});
