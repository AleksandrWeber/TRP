import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { createMarkPriceEvent } from '../domain/mark-price-event';
import { MarketHealthStatus } from '../domain/market-status';
import { MarketStreamIntegrityController } from './market-stream-integrity-controller';
import {
  createInitialIntegrityState,
  MarketStreamIntegrityStatus,
} from './market-stream-integrity-state';

const TS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  occurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:01.000Z',
  processedAt: '2026-07-18T10:00:02.000Z',
  recordedAt: '2026-07-18T10:00:03.000Z',
};

function candle(sequence: number, openTime = '2026-07-18T10:00:00.000Z', close = 100 + sequence) {
  const openMs = Date.parse(openTime);
  const closeTime = new Date(openMs + 59_999).toISOString();
  return createClosedCandleEvent({
    workspaceId: 'ws-1',
    sourceId: 'binance-spot',
    instrument: 'BTCUSDT',
    timeframe: Timeframe.M1,
    sequence,
    openTime,
    closeTime,
    open: 100,
    high: 110,
    low: 90,
    close,
    volume: 1,
    ...TS,
    exchangeOccurredAt: openTime,
    occurredAt: openTime,
  });
}

function mark(sequence: number, price = 100 + sequence) {
  return createMarkPriceEvent({
    workspaceId: 'ws-1',
    sourceId: 'binance-spot',
    instrument: 'BTCUSDT',
    sequence,
    price,
    ...TS,
  });
}

describe('US138 — MarketStreamIntegrityController', () => {
  it('accepts contiguous sequences and advances per-stream progress', () => {
    const gate = new MarketStreamIntegrityController();
    const a = gate.admit(candle(1), '2026-07-18T10:01:00.000Z');
    const b = gate.admit(candle(2, '2026-07-18T10:01:00.000Z'), '2026-07-18T10:02:00.000Z');

    expect(a.outcome).toBe('accepted');
    expect(b.outcome).toBe('accepted');
    expect(gate.getState(a.event.streamId)?.lastAppliedSequence).toBe(2);
    expect(gate.getState(a.event.streamId)?.status).toBe(MarketStreamIntegrityStatus.READY);
  });

  it('deduplicates exact semantic duplicates with no second business effect', () => {
    const gate = new MarketStreamIntegrityController();
    const first = candle(1);
    const duplicate = createClosedCandleEvent({
      workspaceId: first.workspaceId,
      sourceId: first.sourceId,
      instrument: first.instrument,
      timeframe: first.timeframe,
      sequence: 2,
      openTime: first.openTime,
      closeTime: first.closeTime,
      open: first.open,
      high: first.high,
      low: first.low,
      close: first.close,
      volume: first.volume,
      exchangeOccurredAt: first.exchangeOccurredAt,
      occurredAt: first.occurredAt,
      receivedAt: '2026-07-18T10:00:10.000Z',
      processedAt: '2026-07-18T10:00:11.000Z',
      recordedAt: '2026-07-18T10:00:12.000Z',
    });

    expect(gate.admit(first, '2026-07-18T10:01:00.000Z').outcome).toBe('accepted');
    const result = gate.admit(duplicate, '2026-07-18T10:01:01.000Z');
    expect(result.outcome).toBe('duplicate');
    if (result.outcome === 'duplicate') {
      expect(result.kind).toBe('semantic');
    }
    expect(gate.metrics(first.streamId)?.duplicateCount).toBe(1);
    expect(gate.getState(first.streamId)?.lastAppliedSequence).toBe(1);
  });

  it('ignores stale/already-applied sequences and measures them', () => {
    const gate = new MarketStreamIntegrityController();
    const streamId = candle(1).streamId;
    gate.seed(
      createInitialIntegrityState({
        streamId,
        workspaceId: 'ws-1',
        updatedAt: '2026-07-18T10:00:00.000Z',
        lastAppliedSequence: 5,
        lastEventId: 'evt-5',
        lastSemanticIdentity: 'sem-5',
        lastOccurredAt: '2026-07-18T10:05:00.000Z',
      }),
    );

    const stale = gate.admit(candle(3), '2026-07-18T10:06:00.000Z');
    expect(stale.outcome).toBe('stale');
    if (stale.outcome === 'stale') {
      expect(stale.lastAppliedSequence).toBe(5);
      expect(stale.receivedSequence).toBe(3);
    }
    expect(gate.metrics(streamId)?.staleSequenceCount).toBe(1);
    expect(gate.getState(streamId)?.lastAppliedSequence).toBe(5);
  });

  it('defers future sequences and places only that stream in gap state', () => {
    const gate = new MarketStreamIntegrityController();
    const candleStream = candle(1);
    expect(gate.admit(candleStream, '2026-07-18T10:01:00.000Z').outcome).toBe('accepted');

    const gap = gate.admit(candle(4, '2026-07-18T10:03:00.000Z'), '2026-07-18T10:04:00.000Z');
    expect(gap.outcome).toBe('deferred_gap');
    if (gap.outcome === 'deferred_gap') {
      expect(gap.expectedSequence).toBe(2);
      expect(gap.receivedSequence).toBe(4);
    }
    const blocked = gate.getState(candleStream.streamId);
    expect(blocked?.status).toBe(MarketStreamIntegrityStatus.BLOCKED_GAP);
    expect(blocked?.health).toBe(MarketHealthStatus.RECOVERING);

    const markEvent = mark(1);
    expect(gate.admit(markEvent, '2026-07-18T10:04:01.000Z').outcome).toBe('accepted');
    expect(gate.getState(markEvent.streamId)?.status).toBe(MarketStreamIntegrityStatus.READY);
    expect(gate.getState(candleStream.streamId)?.status).toBe(
      MarketStreamIntegrityStatus.BLOCKED_GAP,
    );
  });

  it('does not impose global ordering across independent streams', () => {
    const gate = new MarketStreamIntegrityController();
    const m = mark(1);
    const c = candle(1);
    expect(gate.admit(m, '2026-07-18T10:00:00.000Z').outcome).toBe('accepted');
    expect(gate.admit(c, '2026-07-18T09:00:00.000Z').outcome).toBe('accepted');
    expect(String(m.streamId)).not.toBe(String(c.streamId));
  });
});
