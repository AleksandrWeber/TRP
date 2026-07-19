import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain/domain/candle';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Strategy, StrategyParameters } from '../strategies';
import {
  EmaIndicator,
  IndicatorRegistry,
  InsufficientIndicatorInputError,
  InvalidIndicatorPeriodError,
  SmaIndicator,
  UnknownIndicatorError,
} from '../technical-indicators';
import { EMA_STRATEGY_EVALUATOR_ID, EmaStrategyEvaluator } from './ema-strategy-evaluator';

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

describe('EmaStrategyEvaluator (US012)', () => {
  const evaluator = new EmaStrategyEvaluator(registry());

  it('has the stable ema id', () => {
    expect(evaluator.id).toBe(EMA_STRATEGY_EVALUATOR_ID);
    expect(evaluator.id).toBe('ema');
  });

  it('signals BUY when the latest close is above the EMA', async () => {
    // EMA(3) of [1..5]: seed 2 → 3 → 4; close 5 > 4.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([1, 2, 3, 4, 5]),
    });
    expect(evaluation.signal).toBe('BUY');
  });

  it('signals SELL when the latest close is below the EMA', async () => {
    // EMA(3) of [5..1]: seed 4 → 3 → 2; close 1 < 2.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([5, 4, 3, 2, 1]),
    });
    expect(evaluation.signal).toBe('SELL');
  });

  it('signals SELL when close sits exactly on the EMA', async () => {
    // EMA(1) equals the raw closes.
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 1 }),
      candles: candles([100, 100]),
    });
    expect(evaluation.signal).toBe('SELL');
    expect(evaluation.confidence).toBe(0);
  });

  it('derives confidence from |close − ema| / close', async () => {
    // |5 − 4| / 5 = 0.2
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ period: 3 }),
      candles: candles([1, 2, 3, 4, 5]),
    });
    expect(evaluation.confidence).toBe(0.2);
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
      evaluator: 'ema',
      indicator: 'ema',
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
    const evaluation = await evaluator.evaluate({
      strategy: strategy({ indicator: 'sma', period: 3 }),
      candles: candles([1, 2, 3, 4, 5]),
    });
    expect(evaluation.metadata).toMatchObject({ indicator: 'sma', indicatorValue: 4 });
  });

  it('rejects an unknown indicator id (UNKNOWN_INDICATOR)', async () => {
    await expect(
      evaluator.evaluate({
        strategy: strategy({ indicator: 'macd', period: 3 }),
        candles: candles([1, 2, 3, 4]),
      }),
    ).rejects.toThrow(UnknownIndicatorError);
  });

  it('rejects an invalid period', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 0 }), candles: candles([1, 2, 3]) }),
    ).rejects.toThrow(InvalidIndicatorPeriodError);
  });

  it('rejects a candle window shorter than the period', async () => {
    await expect(
      evaluator.evaluate({ strategy: strategy({ period: 10 }), candles: candles([1, 2, 3]) }),
    ).rejects.toThrow(InsufficientIndicatorInputError);
  });
});
