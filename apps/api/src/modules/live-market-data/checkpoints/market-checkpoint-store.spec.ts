import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { MarketHealthStatus } from '../domain/market-status';
import { InMemoryMarketCheckpointPersistence } from './in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from './market-checkpoint-store';
import { PrismaMarketCheckpointPersistence } from './prisma-market-checkpoint.persistence';

function candle(sequence: number, openTime: string) {
  const openMs = Date.parse(openTime);
  return createClosedCandleEvent({
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'BTCUSDT',
    timeframe: Timeframe.M1,
    sequence,
    openTime,
    closeTime: new Date(openMs + 59_999).toISOString(),
    open: 100,
    high: 110,
    low: 90,
    close: 100 + sequence,
    volume: 1,
    exchangeOccurredAt: openTime,
    occurredAt: openTime,
    receivedAt: '2026-07-18T12:00:01.000Z',
    processedAt: '2026-07-18T12:00:02.000Z',
    recordedAt: '2026-07-18T12:00:03.000Z',
  });
}

describe('US141 — MarketCheckpointStore', () => {
  it('advances only after the event is durably recorded', async () => {
    const store = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
    const event = candle(1, '2026-07-18T12:00:00.000Z');

    await expect(
      store.advance({
        event,
        health: MarketHealthStatus.HEALTHY,
        updatedAt: '2026-07-18T12:01:00.000Z',
        eventDurablyRecorded: false,
      }),
    ).rejects.toThrow(/durably recorded/);

    const advanced = await store.advance({
      event,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:01:00.000Z',
      eventDurablyRecorded: true,
    });
    expect(advanced.lastSequence).toBe(1);
    expect(String(advanced.lastEventId)).toBe(String(event.eventId));
  });

  it('rejects checkpoint regression', async () => {
    const store = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
    await store.advance({
      event: candle(5, '2026-07-18T12:05:00.000Z'),
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:05:30.000Z',
      eventDurablyRecorded: true,
    });

    await expect(
      store.advance({
        event: candle(3, '2026-07-18T12:03:00.000Z'),
        health: MarketHealthStatus.HEALTHY,
        updatedAt: '2026-07-18T12:06:00.000Z',
        eventDurablyRecorded: true,
      }),
    ).rejects.toThrow(/regression rejected/);

    const current = await store.get('ws-1', String(candle(5, '2026-07-18T12:05:00.000Z').streamId));
    expect(current?.lastSequence).toBe(5);
  });

  it('survives process restart via durable persistence', async () => {
    const persistence = new InMemoryMarketCheckpointPersistence();
    const first = new MarketCheckpointStore(persistence);
    const event = candle(2, '2026-07-18T12:02:00.000Z');
    await first.advance({
      event,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:02:30.000Z',
      eventDurablyRecorded: true,
    });

    // "Restart": a new store instance over the same durable rows.
    const restarted = new MarketCheckpointStore(persistence.clone());
    const restored = await restarted.get('ws-1', String(event.streamId));

    expect(restored?.lastSequence).toBe(2);
    expect(restored?.lastOccurredAt).toBe('2026-07-18T12:02:00.000Z');
    expect(restored?.health).toBe(MarketHealthStatus.HEALTHY);
  });

  it('keeps operational heartbeat separate from semantic progress', async () => {
    const store = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
    const event = candle(1, '2026-07-18T12:00:00.000Z');
    const advanced = await store.advance({
      event,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:01:00.000Z',
      eventDurablyRecorded: true,
    });

    const beaten = await store.recordHeartbeat(
      'ws-1',
      String(event.streamId),
      '2026-07-18T12:10:00.000Z',
    );

    expect(beaten.heartbeatAt).toBe('2026-07-18T12:10:00.000Z');
    expect(beaten.lastSequence).toBe(advanced.lastSequence);
    expect(beaten.lastEventId).toBe(advanced.lastEventId);
    expect(beaten.lastOccurredAt).toBe(advanced.lastOccurredAt);
    expect(beaten.updatedAt).toBe(advanced.updatedAt);
  });

  it('is workspace-scoped and readable by future Trading Sessions', async () => {
    const store = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
    const event = candle(1, '2026-07-18T12:00:00.000Z');
    await store.advance({
      event,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:01:00.000Z',
      eventDurablyRecorded: true,
    });

    expect(await store.listByWorkspace('ws-1')).toHaveLength(1);
    expect(await store.listByWorkspace('ws-2')).toHaveLength(0);
    expect(await store.get('ws-2', String(event.streamId))).toBeNull();
  });

  it('persists and restores rows through the Prisma adapter mapping', async () => {
    type WhereKey = { workspaceId_streamId: { workspaceId: string; streamId: string } };
    const rows = new Map<string, Record<string, unknown>>();
    const fakePrisma = {
      marketStreamCheckpointRecord: {
        findUnique: async ({ where }: { where: WhereKey }) => {
          const { workspaceId, streamId } = where.workspaceId_streamId;
          return rows.get(`${workspaceId}::${streamId}`) ?? null;
        },
        findMany: async ({ where }: { where: { workspaceId: string } }) =>
          [...rows.values()].filter((row) => row.workspaceId === where.workspaceId),
        upsert: async ({
          where,
          create,
          update,
        }: {
          where: WhereKey;
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const { workspaceId, streamId } = where.workspaceId_streamId;
          const key = `${workspaceId}::${streamId}`;
          rows.set(key, rows.has(key) ? { ...rows.get(key), ...update } : create);
          return rows.get(key);
        },
      },
    };

    const persistence = new PrismaMarketCheckpointPersistence(fakePrisma as never);
    const store = new MarketCheckpointStore(persistence);
    const event = candle(7, '2026-07-18T12:07:00.000Z');
    await store.advance({
      event,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:07:30.000Z',
      eventDurablyRecorded: true,
    });

    // Fake Prisma returns plain JS rows; adapter maps Date fields.
    const stored = rows.values().next().value as Record<string, unknown>;
    stored.lastOccurredAt = new Date(stored.lastOccurredAt as Date);
    stored.updatedAt = new Date(stored.updatedAt as Date);

    const restored = await store.get('ws-1', String(event.streamId));
    expect(restored?.lastSequence).toBe(7);
    expect(restored?.lastOccurredAt).toBe('2026-07-18T12:07:00.000Z');
    expect(restored?.timeframe).toBe(Timeframe.M1);
  });
});
