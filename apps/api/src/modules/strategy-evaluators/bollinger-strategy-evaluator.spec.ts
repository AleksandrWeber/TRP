import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain/domain/candle';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Strategy, StrategyParameters } from '../strategies';
import {
  BollingerBandsIndicator,
  IndicatorRegistry,
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from '../technical-indicators';
import {
  BOLLINGER_STRATEGY_EVALUATOR_ID,
  BollingerStrategyEvaluator,
} from './bollinger-strategy-evaluator';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';

function registry(): IndicatorRegistry {
  const indicators = new IndicatorRegistry();
  indicators.register(new BollingerBandsIndicator());
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

describe('BollingerStrategyEvaluator (US014)', () => {
  const evaluator = new BollingerStrategyEvaluator(registry());

  it('has the stable bollinger id', () => {
    expect(evaluator.id).toBe(BOLLINGER_STRATEGY_EVALUATOR_ID);
    expect(evaluator.id).toBe('bollinger');
  });

  it('signals BUY when the close breaks the lower band', async () => {
    // Window [10,10,10,10,6]: mean 9.2, σ 1.6, multiplier 1 → lower 7.6;
    // close 6 < 7.6.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 5, multiplier: 1 }),
      candles: candles([10, 10, 10, 10, 6]),
    });
    expect(evaluation.signal).toBe('BUY');
    const metadata = evaluation.metadata as Record<string, number>;
    expect(metadata.lowerBand).toBeCloseTo(7.6, 10);
    expect(metadata.middleBand).toBeCloseTo(9.2, 10);
    expect(metadata.upperBand).toBeCloseTo(10.8, 10);
    // (7.6 − 6) / 6 = 0.2667 after rounding.
    expect(evaluation.confidence).toBe(0.2667);
  });

  it('signals SELL when the close breaks the upper band', async () => {
    // Window [10,10,10,10,14]: mean 10.8, σ 1.6, multiplier 1 → upper 12.4;
    // close 14 > 12.4.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 5, multiplier: 1 }),
      candles: candles([10, 10, 10, 10, 14]),
    });
    expect(evaluation.signal).toBe('SELL');
    const metadata = evaluation.metadata as Record<string, number>;
    expect(metadata.upperBand).toBeCloseTo(12.4, 10);
    // (14 − 12.4) / 14 = 0.1143 after rounding.
    expect(evaluation.confidence).toBe(0.1143);
  });

  it('signals HOLD when the close stays inside the bands', async () => {
    // Window [10,12,10,12,11]: mean 11, σ ≈ 0.894, multiplier 2 → bands
    // ≈ [9.21, 12.79]; close 11 stays inside.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 5, multiplier: 2 }),
      candles: candles([10, 12, 10, 12, 11]),
    });
    expect(evaluation.signal).toBe('HOLD');
    expect(evaluation.confidence).toBe(0);
  });

  it('signals BUY with confidence 0 on a zero-width band (boundary)', async () => {
    // Flat window: σ = 0 → upper = lower = middle = close. Close touches
    // both bands; the BUY branch wins deterministically.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 5, multiplier: 2 }),
      candles: candles([10, 10, 10, 10, 10]),
    });
    expect(evaluation.signal).toBe('BUY');
    expect(evaluation.confidence).toBe(0);
  });

  it('defaults to period=20 and multiplier=2', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({}),
      candles: candles(Array.from({ length: 25 }, (_, i) => 100 + (i % 3))),
    });
    expect(evaluation.metadata).toMatchObject({ period: 20, multiplier: 2 });
  });

  it('exposes the decision inputs in metadata', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 5, multiplier: 1 }),
      candles: candles([10, 10, 10, 10, 6]),
    });
    expect(Object.keys(evaluation.metadata).sort()).toEqual([
      'calculatedLength',
      'candlesEvaluated',
      'close',
      'evaluator',
      'indicator',
      'lowerBand',
      'middleBand',
      'multiplier',
      'period',
      'upperBand',
    ]);
    expect(evaluation.metadata).toMatchObject({
      evaluator: 'bollinger',
      indicator: 'bollinger',
      period: 5,
      multiplier: 1,
      close: 6,
      candlesEvaluated: 5,
      calculatedLength: 1,
    });
  });

  it('is fully deterministic for identical input', async () => {
    const context = {
      strategy: strategy({ period: 5, multiplier: 2 }),
      candles: candles([10, 12, 10, 12, 11]),
    };
    expect(await evaluator.evaluate(context)).toEqual(await evaluator.evaluate(context));
  });

  it('rejects an invalid period', async () => {
    for (const period of [0, -1, 2.5, NaN, Infinity, '20' as unknown as number]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy({ period }),
          candles: candles([1, 2, 3, 4, 5]),
        }),
      ).rejects.toThrow(InvalidIndicatorPeriodError);
    }
  });

  it('rejects an invalid multiplier', async () => {
    for (const multiplier of [0, -1, NaN, Infinity, '2' as unknown as number]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy({ period: 5, multiplier }),
          candles: candles([1, 2, 3, 4, 5]),
        }),
      ).rejects.toThrow(InvalidEvaluatorConfigError);
    }
  });

  it('rejects a candle window shorter than the period', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 5 }), candles: candles([1, 2, 3]) }),
    ).rejects.toThrow(InsufficientIndicatorInputError);
  });

  it('rejects NaN and Infinity closes', async () => {
    await expect(
      evaluator.evaluate({
        strategy: strategy({ period: 2 }),
        candles: candles([1, NaN, 3]),
      }),
    ).rejects.toThrow(InvalidIndicatorInputError);
    await expect(
      evaluator.evaluate({
        strategy: strategy({ period: 2 }),
        candles: candles([1, Infinity, 3]),
      }),
    ).rejects.toThrow(InvalidIndicatorInputError);
  });
});
