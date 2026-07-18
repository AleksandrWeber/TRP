import { describe, expect, it } from 'vitest';
import { toInstrument } from '../../market-data/instrument';
import { Timeframe } from '../../market-data/timeframe';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { MarketHealthStatus } from '../domain/market-status';
import { MarketDataValidator } from '../normalization/market-data-validator';
import type { ClosedCandleBackfillBar } from '../ports/live-market-connector';
import { ClosedCandleGapRecoveryService } from './gap-recovery-service';
import { MarketStreamIntegrityController } from './market-stream-integrity-controller';
import { MarketStreamIntegrityStatus } from './market-stream-integrity-state';

const OPS = {
  receivedAt: '2026-07-18T10:00:01.000Z',
  processedAt: '2026-07-18T10:00:02.000Z',
  recordedAt: '2026-07-18T10:00:03.000Z',
};

function candle(input: { sequence: number; openTime: string; close?: number }) {
  const openMs = Date.parse(input.openTime);
  return createClosedCandleEvent({
    workspaceId: 'ws-1',
    sourceId: 'binance-spot',
    instrument: 'BTCUSDT',
    timeframe: Timeframe.M1,
    sequence: input.sequence,
    openTime: input.openTime,
    closeTime: new Date(openMs + 59_999).toISOString(),
    open: 100,
    high: 110,
    low: 90,
    close: input.close ?? 100 + input.sequence,
    volume: 1,
    exchangeOccurredAt: input.openTime,
    occurredAt: input.openTime,
    ...OPS,
  });
}

function bar(openTime: string, close = 101): ClosedCandleBackfillBar {
  const openMs = Date.parse(openTime);
  return Object.freeze({
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.M1,
    openTime,
    closeTime: new Date(openMs + 59_999).toISOString(),
    open: 100,
    high: 110,
    low: 90,
    close,
    volume: 1,
    exchangeOccurredAt: openTime,
  });
}

describe('US139 — ClosedCandleGapRecoveryService', () => {
  it('repairs missing intervals via REST using the same validation path', async () => {
    const integrity = new MarketStreamIntegrityController();
    const first = candle({ sequence: 1, openTime: '2026-07-18T10:00:00.000Z' });
    expect(integrity.admit(first, '2026-07-18T10:00:05.000Z').outcome).toBe('accepted');

    const deferred = candle({ sequence: 4, openTime: '2026-07-18T10:03:00.000Z', close: 104 });
    expect(integrity.admit(deferred, '2026-07-18T10:03:05.000Z').outcome).toBe('deferred_gap');

    const bars = [bar('2026-07-18T10:01:00.000Z', 102), bar('2026-07-18T10:02:00.000Z', 103)];
    const service = new ClosedCandleGapRecoveryService(integrity, new MarketDataValidator(), {
      backfill: async () => bars,
    });

    const result = await service.recover({
      streamId: first.streamId,
      workspaceId: 'ws-1',
      sourceId: 'binance-spot',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.M1,
      deferredEvent: deferred,
      recoveredAt: '2026-07-18T10:03:10.000Z',
    });

    expect(result.outcome).toBe('recovered');
    expect(result.gapClosed).toBe(true);
    expect(result.state?.status).toBe(MarketStreamIntegrityStatus.READY);
    expect(result.state?.health).toBe(MarketHealthStatus.HEALTHY);
    expect(result.state?.lastAppliedSequence).toBe(4);
  });

  it('eliminates overlapping live/backfill events without duplicate output', async () => {
    const integrity = new MarketStreamIntegrityController();
    const first = candle({ sequence: 1, openTime: '2026-07-18T10:00:00.000Z' });
    integrity.admit(first, '2026-07-18T10:00:05.000Z');

    const deferred = candle({ sequence: 3, openTime: '2026-07-18T10:02:00.000Z', close: 103 });
    integrity.admit(deferred, '2026-07-18T10:02:05.000Z');

    // Overlap: REST returns the already-accepted first bar plus the missing middle bar.
    const overlapFirst = bar('2026-07-18T10:00:00.000Z', 101);
    const missing = bar('2026-07-18T10:01:00.000Z', 102);
    const service = new ClosedCandleGapRecoveryService(integrity, new MarketDataValidator(), {
      backfill: async () => [overlapFirst, missing],
    });

    const result = await service.recover({
      streamId: first.streamId,
      workspaceId: 'ws-1',
      sourceId: 'binance-spot',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.M1,
      deferredEvent: deferred,
      recoveredAt: '2026-07-18T10:02:10.000Z',
    });

    expect(result.outcome).toBe('recovered');
    const duplicates = result.admitted.filter((row) => row.outcome === 'duplicate');
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(result.state?.lastAppliedSequence).toBe(3);
    expect(integrity.metrics(first.streamId)?.acceptedCount).toBe(3);
  });

  it('keeps health recovering/degraded when gaps remain unresolved', async () => {
    const integrity = new MarketStreamIntegrityController();
    const first = candle({ sequence: 1, openTime: '2026-07-18T10:00:00.000Z' });
    integrity.admit(first, '2026-07-18T10:00:05.000Z');
    const deferred = candle({ sequence: 4, openTime: '2026-07-18T10:03:00.000Z', close: 104 });
    integrity.admit(deferred, '2026-07-18T10:03:05.000Z');

    const service = new ClosedCandleGapRecoveryService(integrity, new MarketDataValidator(), {
      // Only one of two missing bars — incomplete recovery.
      backfill: async () => [bar('2026-07-18T10:01:00.000Z', 102)],
    });

    const result = await service.recover({
      streamId: first.streamId,
      workspaceId: 'ws-1',
      sourceId: 'binance-spot',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.M1,
      deferredEvent: deferred,
      recoveredAt: '2026-07-18T10:03:10.000Z',
    });

    expect(result.outcome).toBe('unresolved');
    expect(result.gapClosed).toBe(false);
    expect(result.gap?.unresolved).toBe(true);
    expect(result.state?.status).toBe(MarketStreamIntegrityStatus.UNRESOLVED_GAP);
    expect(result.state?.health).toBe(MarketHealthStatus.DEGRADED);
  });

  it('notifies connector markGapRecoveryComplete only after gap closes', async () => {
    const integrity = new MarketStreamIntegrityController();
    const first = candle({ sequence: 1, openTime: '2026-07-18T10:00:00.000Z' });
    integrity.admit(first, '2026-07-18T10:00:05.000Z');
    const deferred = candle({ sequence: 3, openTime: '2026-07-18T10:02:00.000Z', close: 103 });
    integrity.admit(deferred, '2026-07-18T10:02:05.000Z');

    let cleared = false;
    const service = new ClosedCandleGapRecoveryService(integrity, new MarketDataValidator(), {
      backfill: async () => [bar('2026-07-18T10:01:00.000Z', 102)],
    });

    const result = await service.recover({
      streamId: first.streamId,
      workspaceId: 'ws-1',
      sourceId: 'binance-spot',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.M1,
      deferredEvent: deferred,
      recoveredAt: '2026-07-18T10:02:10.000Z',
    });

    expect(result.gapClosed).toBe(true);
    service.notifyConnectorGapComplete({
      markGapRecoveryComplete: () => {
        cleared = true;
      },
    } as never);
    expect(cleared).toBe(true);
  });
});
