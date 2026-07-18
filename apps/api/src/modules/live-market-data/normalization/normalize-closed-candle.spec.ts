import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { mapBinanceKlineMessageToDraft } from '../connectors/binance/map-binance-kline-message';
import {
  closedCandlesAreSemanticallyEqual,
  normalizeClosedCandle,
} from './normalize-closed-candle';
import type { ClosedCandleDraft } from './closed-candle-draft';

const OPS_A = {
  receivedAt: '2026-07-18T10:00:00.010Z',
  processedAt: '2026-07-18T10:00:00.020Z',
  recordedAt: '2026-07-18T10:00:00.030Z',
} as const;

const OPS_B = {
  receivedAt: '2026-07-18T11:00:00.010Z',
  processedAt: '2026-07-18T11:00:00.520Z',
  recordedAt: '2026-07-18T11:00:00.900Z',
} as const;

function baseDraft(overrides: Partial<ClosedCandleDraft> = {}): ClosedCandleDraft {
  return Object.freeze({
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'BTCUSDT',
    timeframe: Timeframe.H1,
    openTime: '2026-07-18T09:00:00.000Z',
    closeTime: '2026-07-18T09:59:59.999Z',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 12,
    exchangeOccurredAt: '2026-07-18T09:00:00.000Z',
    sequence: 1,
    isClosed: true,
    ...OPS_A,
    ...overrides,
  });
}

describe('Closed-candle normalization (US135)', () => {
  it('rejects open or incomplete candles', () => {
    const result = normalizeClosedCandle(baseDraft({ isClosed: false }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/open or incomplete/);
  });

  it('enforces OHLC and volume validation', () => {
    const badHigh = normalizeClosedCandle(baseDraft({ high: 90, low: 95 }));
    expect(badHigh.ok).toBe(false);

    const badVolume = normalizeClosedCandle(baseDraft({ volume: -1 }));
    expect(badVolume.ok).toBe(false);
  });

  it('produces equivalent semantic events for equivalent business payloads', () => {
    const a = normalizeClosedCandle(baseDraft({ ...OPS_A }));
    const b = normalizeClosedCandle(baseDraft({ ...OPS_B }));
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    expect(closedCandlesAreSemanticallyEqual(a.event, b.event)).toBe(true);
    expect(a.event.receivedAt).not.toBe(b.event.receivedAt);
    expect(a.event.processedAt).not.toBe(b.event.processedAt);
    expect(a.event.close).toBe(105);
  });

  it('does not leak provider fields into the canonical payload', () => {
    const result = normalizeClosedCandle(baseDraft());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const keys = Object.keys(result.event);
    expect(keys).not.toContain('e');
    expect(keys).not.toContain('k');
    expect(keys).not.toContain('x');
    expect(keys).not.toContain('raw');
    expect(keys).not.toContain('binance');
  });

  it('maps Binance kline messages inside the adapter without leaking raw keys on the draft', () => {
    const nowMs = Date.parse('2026-07-18T10:00:00.000Z');
    const draft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-1',
      timeframe: Timeframe.H1,
      sequence: 7,
      nowMs,
      receivedAt: OPS_A.receivedAt,
      processedAt: OPS_A.processedAt,
      recordedAt: OPS_A.recordedAt,
      message: {
        e: 'kline',
        E: nowMs,
        s: 'BTCUSDT',
        k: {
          t: Date.parse('2026-07-18T09:00:00.000Z'),
          T: Date.parse('2026-07-18T09:59:59.999Z'),
          s: 'BTCUSDT',
          i: '1h',
          o: '100',
          h: '110',
          l: '95',
          c: '105',
          v: '12',
          x: true,
        },
      },
    });

    expect(draft.isClosed).toBe(true);
    expect('e' in draft).toBe(false);
    expect('k' in draft).toBe(false);
    expect('x' in draft).toBe(false);

    const openDraft = mapBinanceKlineMessageToDraft({
      workspaceId: 'ws-1',
      timeframe: Timeframe.H1,
      sequence: 8,
      nowMs,
      receivedAt: OPS_A.receivedAt,
      processedAt: OPS_A.processedAt,
      recordedAt: OPS_A.recordedAt,
      message: {
        e: 'kline',
        s: 'BTCUSDT',
        k: {
          t: Date.parse('2026-07-18T09:00:00.000Z'),
          T: Date.parse('2026-07-18T09:59:59.999Z'),
          s: 'BTCUSDT',
          o: '100',
          h: '110',
          l: '95',
          c: '105',
          v: '12',
          x: false,
        },
      },
    });
    expect(openDraft.isClosed).toBe(false);
    expect(normalizeClosedCandle(openDraft).ok).toBe(false);

    const normalized = normalizeClosedCandle(draft);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;
    expect(normalized.event.eventType).toBe('MarketClosedCandle');
    expect(JSON.stringify(normalized.event)).not.toContain('"e":"kline"');
  });
});
