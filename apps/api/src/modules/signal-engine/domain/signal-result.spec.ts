import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import { createSignalResult, isSignalType, SIGNAL_TYPES, type SignalResult } from './signal-result';

const VALID: SignalResult = {
  strategyId: 'strategy-1',
  symbol: 'BTCUSDT',
  timeframe: Timeframe.H1,
  signal: 'BUY',
  confidence: 0.75,
  timestamp: '2026-01-01T00:00:00.000Z',
  metadata: { evaluator: 'dummy' },
};

describe('SignalResult (US009)', () => {
  it('exposes exactly BUY / SELL / HOLD', () => {
    expect(SIGNAL_TYPES).toEqual(['BUY', 'SELL', 'HOLD']);
    expect(isSignalType('BUY')).toBe(true);
    expect(isSignalType('HOLD')).toBe(true);
    expect(isSignalType('WAIT')).toBe(false);
  });

  it('creates a frozen result with frozen metadata', () => {
    const result = createSignalResult(VALID);
    expect(result).toEqual(VALID);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
  });

  it('rejects an empty strategyId', () => {
    expect(() => createSignalResult({ ...VALID, strategyId: '  ' })).toThrow(/strategyId/);
  });

  it('rejects a malformed symbol', () => {
    expect(() => createSignalResult({ ...VALID, symbol: 'btc/usdt' })).toThrow(/symbol/);
  });

  it('rejects an unsupported timeframe', () => {
    expect(() =>
      createSignalResult({ ...VALID, timeframe: '30m' as unknown as Timeframe }),
    ).toThrow(/timeframe/);
  });

  it('rejects an unsupported signal', () => {
    expect(() =>
      createSignalResult({ ...VALID, signal: 'WAIT' as unknown as SignalResult['signal'] }),
    ).toThrow(/signal/);
  });

  it('rejects out-of-range or non-finite confidence', () => {
    expect(() => createSignalResult({ ...VALID, confidence: -0.1 })).toThrow(/confidence/);
    expect(() => createSignalResult({ ...VALID, confidence: 1.1 })).toThrow(/confidence/);
    expect(() => createSignalResult({ ...VALID, confidence: Number.NaN })).toThrow(/confidence/);
  });

  it('accepts the confidence boundaries 0 and 1', () => {
    expect(createSignalResult({ ...VALID, confidence: 0 }).confidence).toBe(0);
    expect(createSignalResult({ ...VALID, confidence: 1 }).confidence).toBe(1);
  });

  it('rejects an invalid timestamp', () => {
    expect(() => createSignalResult({ ...VALID, timestamp: 'yesterday' })).toThrow(/timestamp/);
  });

  it('rejects non-object metadata', () => {
    expect(() =>
      createSignalResult({ ...VALID, metadata: null as unknown as SignalResult['metadata'] }),
    ).toThrow(/metadata/);
    expect(() =>
      createSignalResult({ ...VALID, metadata: [1] as unknown as SignalResult['metadata'] }),
    ).toThrow(/metadata/);
  });
});
