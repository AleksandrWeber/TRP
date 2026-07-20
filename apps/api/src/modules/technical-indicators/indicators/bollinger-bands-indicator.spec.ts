import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from '../domain/technical-indicators.error';
import { BOLLINGER_BANDS_INDICATOR_ID, BollingerBandsIndicator } from './bollinger-bands-indicator';

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

describe('BollingerBandsIndicator (US013)', () => {
  const bollinger = new BollingerBandsIndicator();

  it('exposes its stable identity', () => {
    expect(bollinger.id()).toBe(BOLLINGER_BANDS_INDICATOR_ID);
    expect(bollinger.id()).toBe('bollinger');
    expect(bollinger.name()).toBe('Bollinger Bands');
  });

  it('matches the standard 20-period, 2-deviation reference dataset', () => {
    const result = bollinger.calculate({
      series: referenceCandles(),
      period: 20,
      multiplier: 2,
    });

    expect(result.middle).toEqual([
      60.707499999999996, 61.076, 61.3635, 61.6985, 61.92450000000001, 62.161000000000016,
      62.32700000000002, 62.36350000000002, 62.41350000000002, 62.39850000000003,
      62.293500000000016, 62.16100000000002, 62.133500000000026, 62.00600000000003,
      61.851000000000035, 61.66100000000004, 61.41850000000004, 61.28350000000004,
      61.225000000000044,
    ]);
    expect(result.standardDeviation).toEqual([
      2.0681075286357022, 1.582180141450428, 1.2708511911314033, 1.1803782232824975,
      1.2362098325117885, 1.396513157831768, 1.4565579288159964, 1.4613051529356382,
      1.4165319445733113, 1.41871165146255, 1.5081123134558247, 1.6102791683418967,
      1.6267983126360839, 1.6689469733922786, 1.854459220364624, 1.9693397370679768,
      2.134186671778094, 2.251226943245555, 2.3145031864298944,
    ]);
    expect(result.upper).toEqual([
      64.8437150572714, 64.24036028290085, 63.90520238226281, 64.059256446565, 64.39691966502359,
      64.95402631566355, 65.240115857632, 65.2861103058713, 65.24656388914664, 65.23592330292513,
      65.30972462691166, 65.38155833668381, 65.38709662527219, 65.34389394678459, 65.55991844072928,
      65.599679474136, 65.68687334355623, 65.78595388649114, 65.85400637285983,
    ]);
    expect(result.lower).toEqual([
      56.57128494272859, 57.91163971709914, 58.8217976177372, 59.337743553435004, 59.45208033497643,
      59.36797368433648, 59.413884142368026, 59.44088969412875, 59.5804361108534,
      59.561076697074924, 59.277275373088365, 58.94044166331623, 58.87990337472786,
      58.668106053215475, 58.142081559270785, 57.722320525864085, 57.150126656443845,
      56.78104611350893, 56.59599362714025,
    ]);
    expect(result.metadata).toEqual({
      period: 20,
      multiplier: 2,
      inputLength: 38,
      calculatedLength: 19,
    });
  });

  it('supports configurable periods and multipliers', () => {
    const result = bollinger.calculate({ series: [1, 2, 3, 4], period: 2, multiplier: 1 });
    expect(result.middle).toEqual([1.5, 2.5, 3.5]);
    expect(result.standardDeviation).toEqual([0.5, 0.5, 0.5]);
    expect(result.upper).toEqual([2, 3, 4]);
    expect(result.lower).toEqual([1, 2, 3]);
  });

  it('returns deeply immutable deterministic output without input mutation', () => {
    const series = [1, 2, 4, 8];
    const input = { series, period: 2, multiplier: 2 };
    const result = bollinger.calculate(input);
    expect(result).toEqual(bollinger.calculate(input));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
    for (const values of [result.middle, result.upper, result.lower, result.standardDeviation]) {
      expect(Object.isFrozen(values)).toBe(true);
    }
    expect(series).toEqual([1, 2, 4, 8]);
  });

  it('rejects invalid periods and multipliers', () => {
    expect(() => bollinger.calculate({ series: [1, 2], period: 0, multiplier: 2 })).toThrow(
      InvalidIndicatorPeriodError,
    );
    for (const multiplier of [0, -1, NaN, Infinity]) {
      expect(() => bollinger.calculate({ series: [1, 2], period: 2, multiplier })).toThrow(
        InvalidIndicatorInputError,
      );
    }
  });

  it('rejects insufficient, empty, NaN, and infinite inputs', () => {
    expect(() => bollinger.calculate({ series: [1], period: 2, multiplier: 2 })).toThrow(
      InsufficientIndicatorInputError,
    );
    expect(() => bollinger.calculate({ series: [], period: 2, multiplier: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
    expect(() => bollinger.calculate({ series: [1, NaN], period: 2, multiplier: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
    expect(() => bollinger.calculate({ series: [1, -Infinity], period: 2, multiplier: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
  });
});
