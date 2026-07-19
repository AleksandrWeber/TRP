import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain/domain/candle';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Strategy, StrategyParameters } from '../strategies';
import {
  EmaIndicator,
  IndicatorRegistry,
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
  SmaIndicator,
  UnknownIndicatorError,
} from '../technical-indicators';
import { SMA_STRATEGY_EVALUATOR_ID, SmaStrategyEvaluator } from './sma-strategy-evaluator';

function registry(): IndicatorRegistry {
  const indicators = new IndicatorRegistry();
  indicators.register(new SmaIndicator());
  indicators.register(new EmaIndicator());
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

describe('SmaStrategyEvaluator (US012)', () => {
  const evaluator = new SmaStrategyEvaluator(registry());

  it('has the stable sma id', () => {
    expect(evaluator.id).toBe(SMA_STRATEGY_EVALUATOR_ID);
    expect(evaluator.id).toBe('sma');
  });

  it('signals BUY when the latest close is above the SMA', async () => {
    // SMA(3) of [1..5] ends at (3+4+5)/3 = 4; close 5 > 4.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([1, 2, 3, 4, 5]),
    });
    expect(evaluation.signal).toBe('BUY');
  });

  it('signals SELL when the latest close is below the SMA', async () => {
    // SMA(3) of [5..1] ends at (3+2+1)/3 = 2; close 1 < 2.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([5, 4, 3, 2, 1]),
    });
    expect(evaluation.signal).toBe('SELL');
  });

  it('signals SELL when close sits exactly on the SMA', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([100, 100, 100, 100]),
    });
    expect(evaluation.signal).toBe('SELL');
    expect(evaluation.confidence).toBe(0);
  });

  it('derives confidence from |close − sma| / close', async () => {
    // |5 − 4| / 5 = 0.2
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([1, 2, 3, 4, 5]),
    });
    expect(evaluation.confidence).toBe(0.2);
  });

  it('clamps confidence to 1 for extreme distances', async () => {
    // SMA(2) = (1000 + 1) / 2 = 500.5; |1 − 500.5| / 1 > 1 → clamped.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 2 }),
      candles: candles([1000, 1]),
    });
    expect(evaluation.confidence).toBe(1);
  });

  it('defaults the period to 20 when not configured', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({}),
      candles: candles(Array.from({ length: 25 }, (_, i) => i + 1)),
    });
    expect(evaluation.metadata).toMatchObject({ period: 20 });
  });

  it('exposes the decision inputs in metadata', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([1, 2, 3, 4, 5]),
    });
    expect(evaluation.metadata).toEqual({
      evaluator: 'sma',
      indicator: 'sma',
      period: 3,
      indicatorValue: 4,
      close: 5,
      candlesEvaluated: 5,
      calculatedLength: 3,
    });
  });

  it('is fully deterministic for identical input', async () => {
    const context = { strategy: strategy({ period: 3 }), candles: candles([2, 4, 6, 8]) };
    expect(await evaluator.evaluate(context)).toEqual(await evaluator.evaluate(context));
  });

  it('honours a parameters.indicator override through the registry', async () => {
    // EMA(1) = closes → close == indicator → SELL with confidence 0.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ indicator: 'ema', period: 1 }),
      candles: candles([1, 2, 3]),
    });
    expect(evaluation.signal).toBe('SELL');
    expect(evaluation.metadata).toMatchObject({ indicator: 'ema' });
  });

  it('rejects an unknown indicator id (UNKNOWN_INDICATOR)', async () => {
    await expect(
      evaluator.evaluate({
        strategy: strategy({ indicator: 'rsi', period: 3 }),
        candles: candles([1, 2, 3, 4]),
      }),
    ).rejects.toThrow(UnknownIndicatorError);
  });

  it('rejects an invalid period', async () => {
    for (const period of [0, -1, 2.5, NaN, '20' as unknown as number]) {
      await expect(
        evaluator.evaluate({
          strategy: strategy({ period }),
          candles: candles([1, 2, 3, 4]),
        }),
      ).rejects.toThrow(InvalidIndicatorPeriodError);
    }
  });

  it('rejects a candle window shorter than the period', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 5 }), candles: candles([1, 2, 3]) }),
    ).rejects.toThrow(InsufficientIndicatorInputError);
  });

  it('rejects NaN and Infinity closes', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 2 }), candles: candles([1, NaN, 3]) }),
    ).rejects.toThrow(InvalidIndicatorInputError);
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 2 }), candles: candles([1, Infinity]) }),
    ).rejects.toThrow(InvalidIndicatorInputError);
  });
});
