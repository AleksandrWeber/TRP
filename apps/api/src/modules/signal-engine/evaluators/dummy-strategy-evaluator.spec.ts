import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import type { Strategy } from '../../strategies';
import { DUMMY_STRATEGY_EVALUATOR_ID, DummyStrategyEvaluator } from './dummy-strategy-evaluator';

const STRATEGY: Strategy = {
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
  parameters: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function candle(overrides: Partial<Candle>): Candle {
  return {
    symbol: 'BTCUSDT',
    timeframe: Timeframe.H1,
    openTime: '2026-01-01T00:00:00.000Z',
    closeTime: '2026-01-01T01:00:00.000Z',
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    ...overrides,
  };
}

describe('DummyStrategyEvaluator (US009)', () => {
  const evaluator = new DummyStrategyEvaluator();

  it('has the stable dummy id', () => {
    expect(evaluator.id).toBe(DUMMY_STRATEGY_EVALUATOR_ID);
  });

  it('signals BUY when the latest close is above the open', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: STRATEGY,
      candles: [candle({ open: 100, close: 105 })],
    });
    expect(evaluation.signal).toBe('BUY');
  });

  it('signals SELL when the latest close is below the open', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: STRATEGY,
      candles: [candle({ open: 105, close: 100 })],
    });
    expect(evaluation.signal).toBe('SELL');
  });

  it('signals SELL on a flat candle (close === open)', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: STRATEGY,
      candles: [candle({ open: 100, close: 100 })],
    });
    expect(evaluation.signal).toBe('SELL');
  });

  it('evaluates only the latest candle of the window', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: STRATEGY,
      candles: [
        candle({ open: 100, close: 200, high: 200, low: 100 }),
        candle({ open: 105, close: 100 }),
      ],
    });
    expect(evaluation.signal).toBe('SELL');
    expect(evaluation.metadata).toMatchObject({ candlesEvaluated: 2, open: 105, close: 100 });
  });

  it('derives confidence from the candle body / range ratio', async () => {
    // body = 5, range = 20 → 0.25
    const evaluation = await evaluator.evaluate({
      strategy: STRATEGY,
      candles: [candle({ open: 100, close: 105, high: 110, low: 90 })],
    });
    expect(evaluation.confidence).toBe(0.25);
  });

  it('reports zero confidence for a zero-range candle', async () => {
    const evaluation = await evaluator.evaluate({
      strategy: STRATEGY,
      candles: [candle({ open: 100, close: 100, high: 100, low: 100 })],
    });
    expect(evaluation.confidence).toBe(0);
  });

  it('is fully deterministic for identical input', async () => {
    const context = { strategy: STRATEGY, candles: [candle({})] };
    const first = await evaluator.evaluate(context);
    const second = await evaluator.evaluate(context);
    expect(second).toEqual(first);
  });

  it('exposes the evaluated candle in metadata', async () => {
    const evaluation = await evaluator.evaluate({ strategy: STRATEGY, candles: [candle({})] });
    expect(evaluation.metadata).toEqual({
      evaluator: 'dummy',
      open: 100,
      close: 105,
      candleOpenTime: '2026-01-01T00:00:00.000Z',
      candleCloseTime: '2026-01-01T01:00:00.000Z',
      candlesEvaluated: 1,
    });
  });
});
