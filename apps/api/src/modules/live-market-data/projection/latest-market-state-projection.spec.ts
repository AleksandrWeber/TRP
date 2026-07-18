import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { InMemoryConsumerCheckpointRepository } from '../../event-processing/repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryInboxRepository } from '../../event-processing/repositories/in-memory-inbox.repository';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { createMarkPriceEvent } from '../domain/mark-price-event';
import { MarketHealthStatus } from '../domain/market-status';
import { InMemoryMarketCheckpointPersistence } from '../checkpoints/in-memory-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { LatestMarketStateProjection } from './latest-market-state-projection';

const OPS = {
  receivedAt: '2026-07-18T12:00:01.000Z',
  processedAt: '2026-07-18T12:00:02.000Z',
  recordedAt: '2026-07-18T12:00:03.000Z',
};

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
    ...OPS,
  });
}

function mark(sequence: number, price: number, at: string) {
  return createMarkPriceEvent({
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'BTCUSDT',
    sequence,
    price,
    exchangeOccurredAt: at,
    occurredAt: at,
    ...OPS,
  });
}

function createProjection() {
  const inbox = new InMemoryInboxRepository();
  const consumerCheckpoints = new InMemoryConsumerCheckpointRepository();
  const marketCheckpoints = new MarketCheckpointStore(new InMemoryMarketCheckpointPersistence());
  return {
    projection: new LatestMarketStateProjection(inbox, consumerCheckpoints, marketCheckpoints),
    inbox,
    marketCheckpoints,
  };
}

describe('US143 — LatestMarketStateProjection', () => {
  it('applies via Inbox idempotency (duplicate is a no-op)', async () => {
    const { projection } = createProjection();
    const event = candle(1, '2026-07-18T12:00:00.000Z');

    const first = await projection.apply(event, '2026-07-18T12:01:00.000Z');
    const second = await projection.apply(event, '2026-07-18T12:01:01.000Z');

    expect(first.outcome).toBe('applied');
    expect(second.outcome).toBe('duplicate');
    const state = projection.get('ws-1', String(event.streamId));
    expect(state?.projectionVersion).toBe(1);
    expect(state?.latestClosedCandle?.close).toBe(101);
  });

  it('is workspace- and stream-scoped with explicit freshness', async () => {
    const { projection } = createProjection();
    const c1 = candle(1, '2026-07-18T12:00:00.000Z');
    const m1 = mark(1, 50000, '2026-07-18T12:00:30.000Z');

    await projection.apply(c1, '2026-07-18T12:01:00.000Z');
    await projection.apply(m1, '2026-07-18T12:01:01.000Z');

    expect(projection.listByWorkspace('ws-1')).toHaveLength(2);
    expect(projection.listByWorkspace('ws-2')).toHaveLength(0);
    expect(projection.get('ws-2', String(c1.streamId))).toBeNull();

    const candleState = projection.get('ws-1', String(c1.streamId));
    expect(candleState?.freshnessAt).toBe('2026-07-18T12:00:00.000Z');
    expect(candleState?.latestClosedCandle).not.toBeNull();
    expect(candleState?.latestMarkPrice).toBeNull();

    const markState = projection.get('ws-1', String(m1.streamId));
    expect(markState?.freshnessAt).toBe('2026-07-18T12:00:30.000Z');
    expect(markState?.latestMarkPrice?.price).toBe(50000);
  });

  it('can be rebuilt from retained events and checkpoints', async () => {
    const { projection, marketCheckpoints } = createProjection();
    const e1 = candle(1, '2026-07-18T12:00:00.000Z');
    const e2 = candle(2, '2026-07-18T12:01:00.000Z');
    await marketCheckpoints.advance({
      event: e2,
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T12:01:30.000Z',
      eventDurablyRecorded: true,
    });

    // Apply then clear via rebuild.
    await projection.apply(e1, '2026-07-18T12:00:30.000Z');
    const rebuilt = await projection.rebuild({
      workspaceId: 'ws-1',
      streamId: String(e1.streamId),
      events: [e1, e2],
      rebuiltAt: '2026-07-18T12:05:00.000Z',
    });

    expect(rebuilt?.latestClosedCandle?.sequence).toBe(2);
    expect(rebuilt?.checkpoint?.lastSequence).toBe(2);
    expect(rebuilt?.freshnessAt).toBe('2026-07-18T12:01:00.000Z');
    expect(rebuilt?.projectionVersion).toBe(2);
  });

  it('does not perform strategy, Position, Portfolio, or Risk calculations', async () => {
    const { projection } = createProjection();
    const event = candle(1, '2026-07-18T12:00:00.000Z');
    await projection.apply(event, '2026-07-18T12:01:00.000Z');
    const state = projection.get('ws-1', String(event.streamId))!;
    const keys = Object.keys(state).map((k) => k.toLowerCase());
    for (const forbidden of ['position', 'portfolio', 'risk', 'strategy', 'pnl', 'fill', 'order']) {
      expect(keys.some((k) => k.includes(forbidden))).toBe(false);
    }
    expect(JSON.stringify(state)).not.toMatch(/position|portfolio|riskDecision|signal/i);
  });
});
