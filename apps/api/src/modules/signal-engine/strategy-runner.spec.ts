import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain/domain/candle';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Strategy } from '../strategies';
import { UnknownStrategyEvaluatorError } from './domain/signal-engine.error';
import { DummyStrategyEvaluator } from './evaluators/dummy-strategy-evaluator';
import type { StrategyEvaluator } from './evaluators/strategy-evaluator';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';
import { StrategyRunner } from './strategy-runner';

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

const BULLISH_CANDLE: Candle = {
  symbol: 'BTCUSDT',
  timeframe: Timeframe.H1,
  openTime: '2026-01-01T00:00:00.000Z',
  closeTime: '2026-01-01T01:00:00.000Z',
  open: 100,
  high: 110,
  low: 95,
  close: 108,
  volume: 1000,
};

function buildRunner(extra?: StrategyEvaluator): StrategyRunner {
  const registry = new SignalEvaluatorRegistry();
  registry.register(new DummyStrategyEvaluator());
  if (extra) registry.register(extra);
  return new StrategyRunner(registry);
}

describe('StrategyRunner (US009)', () => {
  it('runs the default evaluator and assembles the SignalResult', async () => {
    const runner = buildRunner();
    const result = await runner.run(STRATEGY, [BULLISH_CANDLE]);

    expect(result).toMatchObject({
      strategyId: 'strategy-1',
      symbol: 'BTCUSDT',
      timeframe: Timeframe.H1,
      signal: 'BUY',
    });
    expect(result.metadata).toMatchObject({ evaluator: 'dummy' });
    expect(Number.isFinite(Date.parse(result.timestamp))).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('uses an explicit evaluation timestamp for deterministic replay', async () => {
    const runner = buildRunner();
    const evaluatedAt = '2026-01-01T01:00:00.000Z';

    const result = await runner.run(STRATEGY, [BULLISH_CANDLE], evaluatedAt);

    expect(result.timestamp).toBe(evaluatedAt);
  });

  it('honors the evaluator requested in strategy parameters', async () => {
    const holder: StrategyEvaluator = {
      id: 'holder',
      evaluate: async () => ({
        signal: 'HOLD',
        confidence: 0.5,
        metadata: { evaluator: 'holder' },
      }),
    };
    const runner = buildRunner(holder);

    const result = await runner.run({ ...STRATEGY, parameters: { evaluator: 'holder' } }, [
      BULLISH_CANDLE,
    ]);
    expect(result.signal).toBe('HOLD');
    expect(result.confidence).toBe(0.5);
    expect(result.metadata).toEqual({ evaluator: 'holder' });
  });

  it('falls back to the default for a non-string evaluator parameter', async () => {
    const runner = buildRunner();
    const result = await runner.run({ ...STRATEGY, parameters: { evaluator: 42 } }, [
      BULLISH_CANDLE,
    ]);
    expect(result.metadata).toMatchObject({ evaluator: 'dummy' });
  });

  it('throws the domain error for an unknown requested evaluator', async () => {
    const runner = buildRunner();
    await expect(
      runner.run({ ...STRATEGY, parameters: { evaluator: 'macd' } }, [BULLISH_CANDLE]),
    ).rejects.toBeInstanceOf(UnknownStrategyEvaluatorError);
  });

  it('rejects an evaluator decision that violates the SignalResult contract', async () => {
    const broken: StrategyEvaluator = {
      id: 'broken',
      evaluate: async () => ({ signal: 'BUY', confidence: 7, metadata: {} }),
    };
    const runner = buildRunner(broken);

    await expect(
      runner.run({ ...STRATEGY, parameters: { evaluator: 'broken' } }, [BULLISH_CANDLE]),
    ).rejects.toThrow(/confidence/);
  });
});
