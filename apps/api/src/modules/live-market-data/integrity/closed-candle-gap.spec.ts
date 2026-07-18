import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import {
  detectClosedCandleGap,
  enumerateGapOpenTimes,
  markGapUnresolved,
} from './closed-candle-gap';

describe('US139 — closed-candle gap detection', () => {
  it('identifies missing candle ranges deterministically', () => {
    const gap = detectClosedCandleGap({
      streamId: 'stream-a',
      timeframe: Timeframe.M1,
      lastAcceptedOpenTime: '2026-07-18T10:00:00.000Z',
      nextObservedOpenTime: '2026-07-18T10:03:00.000Z',
    });

    expect(gap).not.toBeNull();
    expect(gap?.fromOpenTime).toBe('2026-07-18T10:01:00.000Z');
    expect(gap?.toOpenTime).toBe('2026-07-18T10:02:00.000Z');
    expect(gap?.missingIntervalCount).toBe(2);
    expect(enumerateGapOpenTimes(gap!)).toEqual([
      '2026-07-18T10:01:00.000Z',
      '2026-07-18T10:02:00.000Z',
    ]);
  });

  it('returns null for contiguous candles', () => {
    expect(
      detectClosedCandleGap({
        streamId: 'stream-a',
        timeframe: Timeframe.M1,
        lastAcceptedOpenTime: '2026-07-18T10:00:00.000Z',
        nextObservedOpenTime: '2026-07-18T10:01:00.000Z',
      }),
    ).toBeNull();
  });

  it('marks unrecoverable gaps as unresolved without silent skip', () => {
    const gap = detectClosedCandleGap({
      streamId: 'stream-a',
      timeframe: Timeframe.M1,
      lastAcceptedOpenTime: '2026-07-18T10:00:00.000Z',
      nextObservedOpenTime: '2026-07-18T10:02:00.000Z',
    })!;
    const unresolved = markGapUnresolved(gap, 'REST returned incomplete range');
    expect(unresolved.unresolved).toBe(true);
    expect(unresolved.reason).toContain('incomplete');
  });
});
