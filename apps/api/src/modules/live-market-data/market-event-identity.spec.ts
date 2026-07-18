import { describe, expect, it } from 'vitest';
import { Timeframe } from '../market-data/timeframe';
import { createClosedCandleEvent } from './domain/closed-candle-event';
import { createMarkPriceEvent } from './domain/mark-price-event';
import { buildMarketEventSemanticIdentity } from './domain/market-event-identity';
import { buildMarketStreamId } from './domain/market-stream-identity';
import { MarketStreamChannel } from './domain/market-stream-channel';

const BUSINESS = {
  workspaceId: 'ws-1',
  sourceId: 'binance_spot',
  instrument: 'BTCUSDT',
  sequence: 7,
  timeframe: Timeframe.H1,
  openTime: '2026-07-18T09:00:00.000Z',
  closeTime: '2026-07-18T10:00:00.000Z',
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  volume: 12.5,
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
} as const;

describe('Market event identity and timestamps (US127)', () => {
  it('builds deterministic stream identity from workspace/source/instrument/channel', () => {
    const candleStream = buildMarketStreamId({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: Timeframe.H1,
    });
    const markStream = buildMarketStreamId({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.MARK_PRICE,
    });

    expect(candleStream).toBe('ws-1:binance_spot:BTCUSDT:closed_candle:1h');
    expect(markStream).toBe('ws-1:binance_spot:BTCUSDT:mark_price');
    expect(
      buildMarketStreamId({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe: Timeframe.H1,
      }),
    ).toBe(candleStream);
  });

  it('resolves duplicate semantic events to the same deduplication identity', () => {
    const first = createClosedCandleEvent({
      ...BUSINESS,
      eventId: 'uuid-a',
      receivedAt: '2026-07-18T10:00:00.010Z',
      processedAt: '2026-07-18T10:00:00.020Z',
      recordedAt: '2026-07-18T10:00:00.030Z',
    });
    const second = createClosedCandleEvent({
      ...BUSINESS,
      eventId: 'uuid-b',
      receivedAt: '2026-07-18T10:00:05.000Z',
      processedAt: '2026-07-18T10:00:05.100Z',
      recordedAt: '2026-07-18T10:00:05.200Z',
    });

    expect(first.semanticIdentity).toBe(second.semanticIdentity);
    expect(buildMarketEventSemanticIdentity(first)).toBe(buildMarketEventSemanticIdentity(second));
    expect(first.eventId).not.toBe(second.eventId);
    expect(first.receivedAt).not.toBe(second.receivedAt);
  });

  it('keeps exchange/domain timestamps distinct from operational timestamps', () => {
    const event = createMarkPriceEvent({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'ETHUSDT',
      sequence: 1,
      price: 3500,
      exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
      occurredAt: '2026-07-18T10:00:00.000Z',
      receivedAt: '2026-07-18T10:00:00.250Z',
      processedAt: '2026-07-18T10:00:00.300Z',
      recordedAt: '2026-07-18T10:00:00.400Z',
    });

    expect(event.exchangeOccurredAt).toBe('2026-07-18T10:00:00.000Z');
    expect(event.occurredAt).toBe('2026-07-18T10:00:00.000Z');
    expect(event.receivedAt).toBe('2026-07-18T10:00:00.250Z');
    expect(event.processedAt).toBe('2026-07-18T10:00:00.300Z');
    expect(event.recordedAt).toBe('2026-07-18T10:00:00.400Z');
    expect(event.streamId).toBe('ws-1:binance_spot:ETHUSDT:mark_price');
  });

  it('does not let wall-clock processing duration change business payload identity', () => {
    const slow = createClosedCandleEvent({
      ...BUSINESS,
      receivedAt: '2026-07-18T10:00:11.111Z',
      processedAt: '2026-07-18T10:00:30.000Z',
      recordedAt: '2026-07-18T10:00:30.050Z',
    });
    const fast = createClosedCandleEvent({
      ...BUSINESS,
      receivedAt: '2026-07-18T10:00:00.999Z',
      processedAt: '2026-07-18T10:00:00.001Z',
      recordedAt: '2026-07-18T10:00:00.002Z',
    });

    expect(slow.open).toBe(fast.open);
    expect(slow.close).toBe(fast.close);
    expect(slow.volume).toBe(fast.volume);
    expect(slow.semanticIdentity).toBe(fast.semanticIdentity);
    expect(slow.processedAt).not.toBe(fast.processedAt);

    expect(slow.semanticIdentity.includes(slow.processedAt)).toBe(false);
    expect(slow.semanticIdentity.includes(slow.receivedAt)).toBe(false);
    expect(slow.semanticIdentity.includes(slow.recordedAt)).toBe(false);
    expect(slow.semanticIdentity.includes(fast.processedAt)).toBe(false);
  });

  it('does not treat UUID alone as semantic identity', () => {
    const a = createMarkPriceEvent({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      sequence: 1,
      price: 100,
      exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
      receivedAt: '2026-07-18T10:00:00.010Z',
      processedAt: '2026-07-18T10:00:00.020Z',
      recordedAt: '2026-07-18T10:00:00.030Z',
      eventId: 'random-uuid-1',
    });
    const b = createMarkPriceEvent({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      sequence: 1,
      price: 100,
      exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
      receivedAt: '2026-07-18T11:00:00.010Z',
      processedAt: '2026-07-18T11:00:00.020Z',
      recordedAt: '2026-07-18T11:00:00.030Z',
      eventId: 'random-uuid-2',
    });

    expect(a.eventId).not.toBe(b.eventId);
    expect(a.semanticIdentity).toBe(b.semanticIdentity);
  });
});
