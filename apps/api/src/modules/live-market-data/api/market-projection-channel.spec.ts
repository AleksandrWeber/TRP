import { firstValueFrom, take } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { InMemoryConsumerCheckpointRepository } from '../../event-processing/repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryInboxRepository } from '../../event-processing/repositories/in-memory-inbox.repository';
import { Timeframe } from '../../market-data/timeframe';
import { InMemoryMarketCheckpointPersistence } from '../checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { LatestMarketStateProjection } from '../projection/latest-market-state-projection';
import { MarketProjectionBroadcaster } from './market-projection-broadcaster';
import { MarketProjectionChannelService } from './market-projection-channel.service';

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

async function seedProjection() {
  const projection = new LatestMarketStateProjection(
    new InMemoryInboxRepository(),
    new InMemoryConsumerCheckpointRepository(),
    new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence()),
  );
  const event = candle(1, '2026-07-18T12:00:00.000Z');
  await projection.apply(event, '2026-07-18T12:01:00.000Z');
  return { projection, event, streamId: String(event.streamId) };
}

describe('US147 — Market projection channel', () => {
  it('delivers canonical projections and isolates workspaces', async () => {
    const { projection, streamId } = await seedProjection();
    const broadcaster = new MarketProjectionBroadcaster();
    const state = projection.get('ws-1', streamId)!;

    const ws1 = broadcaster.subscribe({ workspaceId: 'ws-1', maxBuffered: 8 });
    const ws2 = broadcaster.subscribe({ workspaceId: 'ws-2', maxBuffered: 8 });

    broadcaster.publish(state, '2026-07-18T12:02:00.000Z');

    const delivered = ws1.next();
    expect(delivered).not.toBeNull();
    expect(delivered?.workspaceId).toBe('ws-1');
    expect(delivered?.authoritative).toBe(false);
    expect(JSON.stringify(delivered)).not.toContain('kline');
    expect(JSON.stringify(delivered)).not.toContain('"e":');
    expect(ws2.next()).toBeNull();
    ws1.close();
    ws2.close();
  });

  it('resumes from cursor / supports refresh snapshot', async () => {
    const { projection, streamId } = await seedProjection();
    const event2 = candle(2, '2026-07-18T12:01:00.000Z');
    await projection.apply(event2, '2026-07-18T12:02:00.000Z');
    const broadcaster = new MarketProjectionBroadcaster();
    const channel = new MarketProjectionChannelService(broadcaster, projection);

    const sub = broadcaster.subscribe({
      workspaceId: 'ws-1',
      streamId,
      afterCursor: { streamId, projectionVersion: 1 },
      maxBuffered: 8,
    });

    broadcaster.publish(projection.get('ws-1', streamId)!, '2026-07-18T12:03:00.000Z');
    const next = sub.next();
    expect(next?.cursor.projectionVersion).toBe(2);

    // Refresh via channel observable emits at least one refresh/update event.
    const observable = channel.open({
      workspaceId: 'ws-1',
      streamId,
      refresh: true,
      cursorVersion: 1,
      cursorStreamId: streamId,
      now: '2026-07-18T12:04:00.000Z',
    });
    const message = await firstValueFrom(observable.pipe(take(1)));
    expect(message.data).toMatchObject({
      workspaceId: 'ws-1',
      authoritative: false,
    });
    sub.close();
  });

  it('applies drop-oldest backpressure so slow clients cannot block producers', () => {
    const broadcaster = new MarketProjectionBroadcaster();
    const sub = broadcaster.subscribe({
      workspaceId: 'ws-1',
      streamId: 's1',
      maxBuffered: 2,
    });

    for (let i = 1; i <= 5; i += 1) {
      const envelope = {
        type: 'update' as const,
        workspaceId: 'ws-1',
        streamId: 's1',
        cursor: { projectionVersion: i, streamId: 's1' },
        projection: {
          workspaceId: 'ws-1',
          streamId: 's1',
          sourceId: 'binance_spot',
          instrument: 'BTCUSDT',
          channel: 'closed_candle',
          latestClosedCandle: null,
          latestMarkPrice: null,
          checkpoint: null,
          freshnessAt: null,
          projectionVersion: i,
          updatedAt: '2026-07-18T12:00:00.000Z',
          authoritative: false as const,
        },
        authoritative: false as const,
        publishedAt: '2026-07-18T12:00:00.000Z',
      };
      // Drive via internal subject by publishing through subscribe push path.
      sub.push(envelope);
    }

    expect(sub.pending()).toBe(2);
    expect(sub.droppedCount()).toBeGreaterThan(0);
    const first = sub.next();
    expect(first?.cursor.projectionVersion).toBeGreaterThanOrEqual(4);
    sub.close();
  });

  it('channel publish failures do not affect ingestion callers', () => {
    const broadcaster = new MarketProjectionBroadcaster();
    // Force sanitizer failure via forbidden provider key on the object graph.
    const bad = {
      workspaceId: 'ws-1',
      streamId: 's1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      channel: 'closed_candle',
      latestClosedCandle: null,
      latestMarkPrice: null,
      checkpoint: null,
      freshnessAt: null,
      projectionVersion: 1,
      updatedAt: '2026-07-18T12:00:00.000Z',
      kline: { e: 'kline' },
    };
    expect(() => broadcaster.publish(bad as never, '2026-07-18T12:00:00.000Z')).not.toThrow();
  });
});
