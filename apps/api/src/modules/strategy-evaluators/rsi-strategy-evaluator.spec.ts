import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain/domain/candle';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Strategy, StrategyParameters } from '../strategies';
import {
  IndicatorRegistry,
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
  RsiIndicator,
} from '../technical-indicators';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';
import { RSI_STRATEGY_EVALUATOR_ID, RsiStrategyEvaluator } from './rsi-strategy-evaluator';

function registry(): IndicatorRegistry {
  const indicators = new IndicatorRegistry();
  indicators.register(new RsiIndicator());
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

describe('RsiStrategyEvaluator (US014)', () => {
  const evaluator = new RsiStrategyEvaluator(registry());

  it('has the stable rsi id', () => {
    expect(evaluator.id).toBe(RSI_STRATEGY_EVALUATOR_ID);
    expect(evaluator.id).toBe('rsi');
  });

  it('signals BUY when RSI is below the oversold threshold', async () => {
    // Strictly falling closes → all losses → RSI 0 <= 30.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([10, 9, 8, 7, 6]),
    });
    expect(evaluation.signal).toBe('BUY');
    expect(evaluation.metadata).toMatchObject({ rsi: 0 });
    // Full penetration: (30 − 0) / 30 = 1.
    expect(evaluation.confidence).toBe(1);
  });

  it('signals SELL when RSI is above the overbought threshold', async () => {
    // Strictly rising closes → all gains → RSI 100 >= 70.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([10, 11, 12, 13, 14]),
    });
    expect(evaluation.signal).toBe('SELL');
    expect(evaluation.metadata).toMatchObject({ rsi: 100 });
    // Full penetration: (100 − 70) / (100 − 70) = 1.
    expect(evaluation.confidence).toBe(1);
  });

  it('signals HOLD when RSI sits between the thresholds', async () => {
    // Wilder RSI(3) of [10, 11, 10, 11, 10] ends at ~44.44 — inside (30, 70).
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([10, 11, 10, 11, 10]),
    });
    expect(evaluation.signal).toBe('HOLD');
    expect(evaluation.confidence).toBe(0);
  });

  it('signals BUY with confidence 0 when RSI sits exactly on oversold (boundary)', async () => {
    // RSI(2) of [10, 11, 10]: averageGain = averageLoss = 0.5 → RSI 50.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 2, oversold: 50, overbought: 60 }),
      candles: candles([10, 11, 10]),
    });
    expect(evaluation.signal).toBe('BUY');
    expect(evaluation.confidence).toBe(0);
    expect(evaluation.metadata).toMatchObject({ rsi: 50, oversold: 50 });
  });

  it('signals SELL with confidence 0 when RSI sits exactly on overbought (boundary)', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 2, oversold: 30, overbought: 50 }),
      candles: candles([10, 11, 10]),
    });
    expect(evaluation.signal).toBe('SELL');
    expect(evaluation.confidence).toBe(0);
    expect(evaluation.metadata).toMatchObject({ rsi: 50, overbought: 50 });
  });

  it('defaults period=14, overbought=70, oversold=30', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({}),
      candles: candles(Array.from({ length: 20 }, (_, i) => 100 + i)),
    });
    expect(evaluation.metadata).toMatchObject({ period: 14, overbought: 70, oversold: 30 });
  });

  it('exposes the decision inputs in metadata', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([10, 9, 8, 7, 6]),
    });
    expect(evaluation.metadata).toEqual({
      evaluator: 'rsi',
      indicator: 'rsi',
      period: 3,
      rsi: 0,
      overbought: 70,
      oversold: 30,
      candlesEvaluated: 5,
      calculatedLength: 2,
    });
  });

  it('is fully deterministic for identical input', async () => {
    const context = {
      strategy: strategy({ period: 3 }),
      candles: candles([10, 11, 10, 11, 10]),
    };
    expect(await evaluator.evaluate(context)).toEqual(await evaluator.evaluate(context));
  });

  it('rejects an invalid period', async () => {
    for (const period of [0, -1, 2.5, NaN, Infinity, '14' as unknown as number]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy({ period }),
          candles: candles([1, 2, 3, 4]),
        }),
      ).rejects.toThrow(InvalidIndicatorPeriodError);
    }
  });

  it('rejects non-numeric or non-finite thresholds', async () => {
    for (const overbought of [
      NaN,
      Infinity,
      '70' as unknown as number,
      null as unknown as number,
    ]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy({ period: 3, overbought }),
          candles: candles([1, 2, 3, 4, 5]),
        }),
      ).rejects.toThrow(InvalidEvaluatorConfigError);
    }
    await expect(
      evaluator.evaluate({
        strategy: strategy({ period: 3, oversold: -Infinity }),
        candles: candles([1, 2, 3, 4, 5]),
      }),
    ).rejects.toThrow(InvalidEvaluatorConfigError);
  });

  it('rejects thresholds outside [0, 100] and oversold >= overbought', async () => {
    const invalid: ReadonlyArray<StrategyParameters> = [
      { period: 3, oversold: -1 },
      { period: 3, overbought: 101 },
      { period: 3, oversold: 70, overbought: 70 },
      { period: 3, oversold: 80, overbought: 20 },
    ];
    for (const parameters of invalid) {
      await expect(
        evaluator.evaluate({
          strategy: strategy(parameters),
          candles: candles([1, 2, 3, 4, 5]),
        }),
      ).rejects.toThrow(InvalidEvaluatorConfigError);
    }
  });

  it('rejects a candle window too short for the period (needs period + 1)', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 5 }), candles: candles([1, 2, 3, 4, 5]) }),
    ).rejects.toThrow(InsufficientIndicatorInputError);
  });

  it('rejects NaN and Infinity closes', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 2 }), candles: candles([1, NaN, 3]) }),
    ).rejects.toThrow(InvalidIndicatorInputError);
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 2 }), candles: candles([1, Infinity, 3]) }),
    ).rejects.toThrow(InvalidIndicatorInputError);
  });
});
