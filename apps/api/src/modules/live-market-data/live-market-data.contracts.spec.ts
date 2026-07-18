import { describe, expect, it } from 'vitest';
import { Timeframe } from '../market-data/timeframe';
import { createClosedCandleEvent } from './domain/closed-candle-event';
import { createMarkPriceEvent } from './domain/mark-price-event';
import { createMarketCheckpoint } from './domain/market-checkpoint';
import { createMarketStatusEvent, MarketHealthStatus } from './domain/market-status';
import { createMarketSubscription, MarketSubscriptionState } from './domain/market-subscription';
import { MarketEventType } from './domain/market-event-type';
import { MarketStreamChannel } from './domain/market-stream-channel';
import { isClosedCandleEvent, isMarkPriceEvent, isMarketStatusEvent } from './domain/market-event';

const TIMESTAMPS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

const BASE = {
  workspaceId: 'ws-1',
  sourceId: 'binance_spot',
  instrument: 'BTCUSDT',
  streamId: 'ws-1:binance_spot:BTCUSDT:closed_candle:1h',
  sequence: 1,
  ...TIMESTAMPS,
} as const;

describe('Live Market Data domain contracts (US126)', () => {
  it('creates an immutable closed-candle event with required fields', () => {
    const event = createClosedCandleEvent({
      ...BASE,
      eventId: 'evt-candle-1',
      timeframe: Timeframe.H1,
      openTime: '2026-07-18T09:00:00.000Z',
      closeTime: '2026-07-18T10:00:00.000Z',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 12.5,
    });

    expect(event.eventType).toBe(MarketEventType.CLOSED_CANDLE);
    expect(event.channel).toBe(MarketStreamChannel.CLOSED_CANDLE);
    expect(event.workspaceId).toBe('ws-1');
    expect(event.sourceId).toBe('binance_spot');
    expect(event.instrument).toBe('BTCUSDT');
    expect(event.streamId).toBe(BASE.streamId);
    expect(event.schemaVersion).toBe(1);
    expect(isClosedCandleEvent(event)).toBe(true);
    expect(isMarkPriceEvent(event)).toBe(false);

    expect(() => {
      (event as { close: number }).close = 999;
    }).toThrow();
    expect(event.close).toBe(105);

    expect(Object.keys(event).sort()).toEqual([
      'channel',
      'close',
      'closeTime',
      'eventId',
      'eventType',
      'exchangeOccurredAt',
      'high',
      'instrument',
      'low',
      'occurredAt',
      'open',
      'openTime',
      'processedAt',
      'receivedAt',
      'recordedAt',
      'schemaVersion',
      'semanticIdentity',
      'sequence',
      'sourceId',
      'streamId',
      'timeframe',
      'volume',
      'workspaceId',
    ]);
  });

  it('creates an immutable mark-price event distinct from closed-candle', () => {
    const event = createMarkPriceEvent({
      ...BASE,
      eventId: 'evt-mark-1',
      streamId: 'ws-1:binance_spot:BTCUSDT:mark_price',
      price: 105.25,
    });

    expect(event.eventType).toBe(MarketEventType.MARK_PRICE);
    expect(event.channel).toBe(MarketStreamChannel.MARK_PRICE);
    expect(event.price).toBe(105.25);
    expect(isMarkPriceEvent(event)).toBe(true);
    expect(isClosedCandleEvent(event)).toBe(false);
    expect('timeframe' in event).toBe(false);
    expect('open' in event).toBe(false);

    expect(() => {
      (event as { price: number }).price = 1;
    }).toThrow();
  });

  it('creates an immutable market status event', () => {
    const event = createMarketStatusEvent({
      ...BASE,
      eventId: 'evt-status-1',
      streamId: 'ws-1:binance_spot:BTCUSDT:market_status',
      status: MarketHealthStatus.HEALTHY,
      reason: 'stream recovered',
    });

    expect(event.eventType).toBe(MarketEventType.STATUS_CHANGED);
    expect(event.channel).toBe(MarketStreamChannel.MARKET_STATUS);
    expect(event.status).toBe(MarketHealthStatus.HEALTHY);
    expect(isMarketStatusEvent(event)).toBe(true);

    expect(() => {
      (event as { status: MarketHealthStatus }).status = MarketHealthStatus.FAILED;
    }).toThrow();
  });

  it('creates workspace-scoped subscription and checkpoint contracts', () => {
    const subscription = createMarketSubscription({
      id: 'sub-1',
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      streamId: BASE.streamId,
      timeframe: Timeframe.H1,
      state: MarketSubscriptionState.DESIRED,
      updatedAt: '2026-07-18T10:00:00.000Z',
    });

    const checkpoint = createMarketCheckpoint({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      channel: MarketStreamChannel.CLOSED_CANDLE,
      streamId: BASE.streamId,
      timeframe: Timeframe.H1,
      lastSequence: 42,
      lastEventId: 'evt-candle-42',
      lastOccurredAt: '2026-07-18T10:00:00.000Z',
      health: MarketHealthStatus.HEALTHY,
      updatedAt: '2026-07-18T10:00:01.000Z',
    });

    expect(subscription.workspaceId).toBe('ws-1');
    expect(subscription.channel).toBe(MarketStreamChannel.CLOSED_CANDLE);
    expect(checkpoint.lastSequence).toBe(42);
    expect(checkpoint.lastEventId).toBe('evt-candle-42');

    expect(() => {
      (subscription as { state: MarketSubscriptionState }).state = MarketSubscriptionState.STOPPED;
    }).toThrow();
    expect(() => {
      (checkpoint as { lastSequence: number }).lastSequence = 0;
    }).toThrow();
  });

  it('rejects incomplete closed-candle and mark-price inputs', () => {
    expect(() =>
      createClosedCandleEvent({
        ...BASE,
        eventId: 'evt-bad',
        timeframe: Timeframe.H1,
        openTime: '2026-07-18T09:00:00.000Z',
        closeTime: '2026-07-18T10:00:00.000Z',
        open: 100,
        high: 90,
        low: 95,
        close: 105,
        volume: 1,
      }),
    ).toThrow(/high must be greater than or equal to low/);

    expect(() =>
      createMarkPriceEvent({
        ...BASE,
        eventId: 'evt-bad-price',
        streamId: 'ws-1:binance_spot:BTCUSDT:mark_price',
        price: 0,
      }),
    ).toThrow(/price must be greater than zero/);

    expect(() =>
      createClosedCandleEvent({
        ...BASE,
        eventId: '   ',
        timeframe: Timeframe.H1,
        openTime: '2026-07-18T09:00:00.000Z',
        closeTime: '2026-07-18T10:00:00.000Z',
        open: 1,
        high: 2,
        low: 1,
        close: 1.5,
        volume: 1,
      }),
    ).toThrow(/eventId must not be empty/);
  });

  it('does not introduce trading or strategy fields on market contracts', () => {
    const candle = createClosedCandleEvent({
      ...BASE,
      eventId: 'evt-candle-2',
      timeframe: Timeframe.M15,
      openTime: '2026-07-18T09:45:00.000Z',
      closeTime: '2026-07-18T10:00:00.000Z',
      open: 1,
      high: 2,
      low: 1,
      close: 1.5,
      volume: 1,
    });
    const mark = createMarkPriceEvent({
      ...BASE,
      eventId: 'evt-mark-2',
      streamId: 'ws-1:binance_spot:BTCUSDT:mark_price',
      price: 1.5,
    });

    const forbidden = [
      'orderId',
      'signalId',
      'strategyId',
      'positionId',
      'ledgerEntryId',
      'fillId',
      'riskDecisionId',
    ];
    for (const field of forbidden) {
      expect(field in candle).toBe(false);
      expect(field in mark).toBe(false);
    }
  });

  it('requires timeframe only for closed-candle subscriptions and checkpoints', () => {
    expect(() =>
      createMarketSubscription({
        id: 'sub-mark',
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        channel: MarketStreamChannel.MARK_PRICE,
        streamId: 'ws-1:binance_spot:BTCUSDT:mark_price',
        timeframe: Timeframe.H1,
        state: MarketSubscriptionState.DESIRED,
        updatedAt: '2026-07-18T10:00:00.000Z',
      }),
    ).toThrow(/timeframe is only allowed for closed_candle/);

    expect(() =>
      createMarketSubscription({
        id: 'sub-candle',
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        channel: MarketStreamChannel.CLOSED_CANDLE,
        streamId: BASE.streamId,
        state: MarketSubscriptionState.DESIRED,
        updatedAt: '2026-07-18T10:00:00.000Z',
      }),
    ).toThrow(/timeframe is required for closed_candle/);
  });
});
