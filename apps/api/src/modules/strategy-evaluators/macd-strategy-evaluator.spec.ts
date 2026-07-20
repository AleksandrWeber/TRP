import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain/domain/candle';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Strategy, StrategyParameters } from '../strategies';
import {
  IndicatorRegistry,
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
  MacdIndicator,
} from '../technical-indicators';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';
import { MACD_STRATEGY_EVALUATOR_ID, MacdStrategyEvaluator } from './macd-strategy-evaluator';

function registry(): IndicatorRegistry {
  const indicators = new IndicatorRegistry();
  indicators.register(new MacdIndicator());
  return indicators;
}

function strategy(parameters: StrategyParameters): Strategy {
  return {
    id: 'strategy-1',
    workspaceId: 'ws-1',
    name: 'Test',
    description: '',
    status: 'active',
    tradingPair: 'BTCUSDT',
    timeframe: '1h',
    direction: 'BOTH',
    positionSize: 1,
    stopLossPercent: 0,
    takeProfitPercent: 0,
    parameters,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function candles(closes: ReadonlyArray<number>): Candle[] {
  return closes.map((close) => ({
    symbol: 'BTCUSDT',
    timeframe: Timeframe.H1,
    openTime: '2026-01-01T00:00:00.000Z',
    closeTime: '2026-01-01T01:00:00.000Z',
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  }));
}

// Compact deterministic configuration: MACD(2, 3, 2) yields two completed
// MACD/Signal pairs from five candles — enough for crossover detection.
const FAST = { evaluator: 'macd', fast: 2, slow: 3, signal: 2 };

describe('MacdStrategyEvaluator (US014)', () => {
  const evaluator = new MacdStrategyEvaluator(registry());

  it('has the stable macd id', () => {
    expect(evaluator.id).toBe(MACD_STRATEGY_EVALUATOR_ID);
    expect(evaluator.id).toBe('macd');
  });

  it('signals BUY when MACD crosses above the Signal line', async () => {
    // Falling closes keep MACD == Signal (−0.5), the final spike lifts MACD
    // to 0.5 while Signal lags at 1/6 → cross above.
    const evaluation = await evaluator.evaluate({
      strategy: strategy(FAST),
      candles: candles([10, 9, 8, 7, 12]),
    });
    expect(evaluation.signal).toBe('BUY');
    expect(evaluation.metadata).toMatchObject({
      previousMacd: expect.closeTo(-0.5, 10) as number,
      previousSignalLine: expect.closeTo(-0.5, 10) as number,
    });
    const metadata = evaluation.metadata as Record<string, number>;
    expect(metadata.macd).toBeCloseTo(0.5, 10);
    expect(metadata.signalLine).toBeCloseTo(1 / 6, 10);
    expect(metadata.histogram).toBeCloseTo(1 / 3, 10);
    // |0.5 − 1/6| / 12 = 1/36 → 0.0278 after rounding.
    expect(evaluation.confidence).toBe(0.0278);
  });

  it('signals SELL when MACD crosses below the Signal line', async () => {
    // Mirror image: rising closes, then a crash → cross below.
    const evaluation = await evaluator.evaluate({
      strategy: strategy(FAST),
      candles: candles([10, 11, 12, 13, 8]),
    });
    expect(evaluation.signal).toBe('SELL');
    const metadata = evaluation.metadata as Record<string, number>;
    expect(metadata.macd).toBeCloseTo(-0.5, 10);
    expect(metadata.signalLine).toBeCloseTo(-1 / 6, 10);
    expect(metadata.histogram).toBeCloseTo(-1 / 3, 10);
    expect(evaluation.confidence).toBeGreaterThan(0);
  });

  it('signals HOLD when no crossover happened', async () => {
    // Steady decline: MACD stays glued to Signal — no cross, no trade.
    const evaluation = await evaluator.evaluate({
      strategy: strategy(FAST),
      candles: candles([10, 9, 8, 7, 6]),
    });
    expect(evaluation.signal).toBe('HOLD');
    expect(evaluation.confidence).toBe(0);
  });

  it('signals HOLD on a flat series (boundary: lines exactly equal)', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy(FAST),
      candles: candles([10, 10, 10, 10, 10]),
    });
    expect(evaluation.signal).toBe('HOLD');
    expect(evaluation.confidence).toBe(0);
  });

  it('defaults to fast=12, slow=26, signal=9', async () => {
    // 12/26/9 needs 35 candles for two completed values.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({}),
      candles: candles(Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i))),
    });
    expect(evaluation.metadata).toMatchObject({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    });
  });

  it('exposes the decision inputs in metadata', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy(FAST),
      candles: candles([10, 9, 8, 7, 12]),
    });
    expect(Object.keys(evaluation.metadata).sort()).toEqual([
      'calculatedLength',
      'candlesEvaluated',
      'close',
      'evaluator',
      'fastPeriod',
      'histogram',
      'indicator',
      'macd',
      'previousMacd',
      'previousSignalLine',
      'signalLine',
      'signalPeriod',
      'slowPeriod',
    ]);
    expect(evaluation.metadata).toMatchObject({
      evaluator: 'macd',
      indicator: 'macd',
      close: 12,
      candlesEvaluated: 5,
      calculatedLength: 2,
    });
  });

  it('is fully deterministic for identical input', async () => {
    const context = { strategy: strategy(FAST), candles: candles([10, 9, 8, 7, 12]) };
    expect(await evaluator.evaluate(context)).toEqual(await evaluator.evaluate(context));
  });

  it('rejects fast >= slow', async () => {
    for (const parameters of [
      { fast: 3, slow: 3, signal: 2 },
      { fast: 5, slow: 3, signal: 2 },
    ]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy(parameters),
          candles: candles([1, 2, 3, 4, 5, 6]),
        }),
      ).rejects.toThrow(InvalidEvaluatorConfigError);
    }
  });

  it('rejects invalid periods', async () => {
    for (const bad of [0, -1, 2.5, NaN, Infinity, '12' as unknown as number]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy({ fast: bad, slow: 26, signal: 9 }),
          candles: candles([1, 2, 3, 4, 5]),
        }),
      ).rejects.toThrow(InvalidIndicatorPeriodError);
      await expect(
        evaluator.evaluate({
          strategy: strategy({ fast: 2, slow: 3, signal: bad }),
          candles: candles([1, 2, 3, 4, 5]),
        }),
      ).rejects.toThrow(InvalidIndicatorPeriodError);
    }
  });

  it('rejects a candle window too short for crossover detection', async () => {
    // MACD(2, 3, 2) yields a single completed value from 4 candles — the
    // evaluator needs two, so slow + signal = 5 candles are required.
    await expect(
      evaluator.evaluate({ strategy: strategy(FAST), candles: candles([1, 2, 3, 4]) }),
    ).rejects.toThrow(InsufficientIndicatorInputError);
  });

  it('rejects NaN and Infinity closes', async () => {
    await expect(
      evaluator.evaluate({
        strategy: strategy(FAST),
        candles: candles([1, 2, NaN, 4, 5]),
      }),
    ).rejects.toThrow(InvalidIndicatorInputError);
    await expect(
      evaluator.evaluate({
        strategy: strategy(FAST),
        candles: candles([1, 2, Infinity, 4, 5]),
      }),
    ).rejects.toThrow(InvalidIndicatorInputError);
  });
});
