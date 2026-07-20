import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from '../domain/technical-indicators.error';
import { MACD_INDICATOR_ID, MacdIndicator } from './macd-indicator';

// Fixed OHLC fixture based on Wilder's published worksheet price series.
const REFERENCE_CLOSES = [
  54.8, 56.8, 57.85, 59.85, 60.57, 61.1, 62.17, 60.6, 62.35, 62.15, 62.35, 61.45, 62.8, 61.37, 62.5,
  62.57, 60.8, 59.37, 60.35, 62.35, 62.17, 62.55, 64.55, 64.37, 65.3, 64.42, 62.9, 61.6, 62.05,
  60.05, 59.7, 60.9, 60.25, 58.27, 58.7, 57.72, 58.1, 58.2,
] as const;

function referenceCandles(): ReadonlyArray<Candle> {
  return REFERENCE_CLOSES.map((close, index) => ({
    symbol: 'BTCUSDT',
    timeframe: Timeframe.D1,
    openTime: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    closeTime: new Date(Date.UTC(2026, 0, index + 2)).toISOString(),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100 + index,
  }));
}

describe('MacdIndicator (US013)', () => {
  const macd = new MacdIndicator();
  const standardPeriods = { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } as const;

  it('exposes its stable identity', () => {
    expect(macd.id()).toBe(MACD_INDICATOR_ID);
    expect(macd.id()).toBe('macd');
    expect(macd.name()).toBe('Moving Average Convergence/Divergence');
  });

  it('matches independently verified standard 12/26/9 EMA reference values', () => {
    const result = macd.calculate({ series: referenceCandles(), ...standardPeriods });

    expect(result.fastEma).toEqual([
      60.99610946004584, 60.64286185080802, 60.193190796837555, 59.87116144347793,
      59.614059682942866,
    ]);
    expect(result.slowEma).toEqual([
      61.01405490029571, 60.842643426199736, 60.611336505740496, 60.42531157938935,
      60.26047368461977,
    ]);
    expect(result.macd).toEqual([
      -0.017945440249874878, -0.19978157539171804, -0.4181457089029408, -0.5541501359114207,
      -0.6464140016769022,
    ]);
    expect(result.signal).toEqual([
      0.8038293699002865, 0.6031071808418856, 0.39885660289292035, 0.20825525513205217,
      0.0373214037702613,
    ]);
    expect(result.histogram).toEqual([
      -0.8217748101501614, -0.8028887562336037, -0.8170023117958611, -0.7624053910434729,
      -0.6837354054471635,
    ]);
    expect(result.metadata).toEqual({
      ...standardPeriods,
      inputLength: 38,
      calculatedLength: 5,
      startIndex: 33,
    });
  });

  it('supports configurable fast, slow, and signal periods', () => {
    const result = macd.calculate({
      series: [1, 2, 3, 4, 5, 6],
      fastPeriod: 2,
      slowPeriod: 3,
      signalPeriod: 2,
    });
    expect(result.fastEma).toEqual([3.5, 4.5, 5.5]);
    expect(result.slowEma).toEqual([3, 4, 5]);
    expect(result.macd).toEqual([0.5, 0.5, 0.5]);
    expect(result.signal).toEqual([0.5, 0.5, 0.5]);
    expect(result.histogram).toEqual([0, 0, 0]);
  });

  it('returns deeply immutable, aligned, deterministic output', () => {
    const input = {
      series: [1, 2, 4, 8, 16, 8, 4],
      fastPeriod: 2,
      slowPeriod: 3,
      signalPeriod: 2,
    } as const;
    const result = macd.calculate(input);
    expect(result).toEqual(macd.calculate(input));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
    for (const values of [
      result.fastEma,
      result.slowEma,
      result.macd,
      result.signal,
      result.histogram,
    ]) {
      expect(Object.isFrozen(values)).toBe(true);
      expect(values).toHaveLength(result.metadata.calculatedLength);
    }
  });

  it('rejects invalid periods and invalid period ordering', () => {
    expect(() =>
      macd.calculate({
        series: [1, 2, 3],
        fastPeriod: 0,
        slowPeriod: 3,
        signalPeriod: 1,
      }),
    ).toThrow(InvalidIndicatorPeriodError);
    expect(() =>
      macd.calculate({
        series: [1, 2, 3],
        fastPeriod: 2,
        slowPeriod: 2,
        signalPeriod: 1,
      }),
    ).toThrow(InvalidIndicatorInputError);
  });

  it('rejects insufficient, empty, NaN, and infinite inputs', () => {
    expect(() =>
      macd.calculate({ series: [1, 2, 3], fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 }),
    ).toThrow(InsufficientIndicatorInputError);
    expect(() =>
      macd.calculate({ series: [], fastPeriod: 1, slowPeriod: 2, signalPeriod: 1 }),
    ).toThrow(InvalidIndicatorInputError);
    expect(() =>
      macd.calculate({ series: [1, NaN, 3], fastPeriod: 1, slowPeriod: 2, signalPeriod: 1 }),
    ).toThrow(InvalidIndicatorInputError);
    expect(() =>
      macd.calculate({ series: [1, Infinity, 3], fastPeriod: 1, slowPeriod: 2, signalPeriod: 1 }),
    ).toThrow(InvalidIndicatorInputError);
  });
});
