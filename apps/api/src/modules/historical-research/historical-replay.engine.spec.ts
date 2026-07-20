import { describe, expect, it } from 'vitest';
import type { Candle } from '../market-data-domain';
import { Timeframe } from '../market-data-domain';
import { SignalEvaluatorRegistry, StrategyRunner } from '../signal-engine';
import type { StrategyEvaluator } from '../signal-engine/evaluators/strategy-evaluator';
import type { Strategy } from '../strategies';
import type { HistoricalDataset } from './domain/historical-research';
import { HistoricalReplayEngine } from './historical-replay.engine';

const STRATEGY: Strategy = {
  id: 'strategy-1',
  workspaceId: 'workspace-1',
  name: 'Replay strategy',
  description: '',
  status: 'active',
  tradingPair: 'BTCUSDT',
  timeframe: '1h',
  direction: 'LONG',
  positionSize: 2,
  stopLossPercent: 0,
  takeProfitPercent: 0,
  parameters: { evaluator: 'sequence' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DATASET: HistoricalDataset = {
  datasetId: 'dataset-1',
  displayName: 'Bull sample',
  description: '',
  marketRegime: 'BULL_MARKET',
  exchange: 'binance',
  symbols: ['BTCUSDT'],
  timeframe: '1h',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-01T03:00:00.000Z',
  enabled: true,
  contentHash: 'dataset-content-hash',
};

describe('HistoricalReplayEngine (US018)', () => {
  it('replays chronological prefixes, reuses virtual execution, and is repeatable', async () => {
    const visibleWindows: string[][] = [];
    const evaluator: StrategyEvaluator = {
      id: 'sequence',
      evaluate: async ({ candles }) => {
        visibleWindows.push(candles.map((candle) => candle.openTime));
        return {
          signal: candles.length < 3 ? 'BUY' : 'SELL',
          confidence: 1,
          metadata: { candlesEvaluated: candles.length },
        };
      },
    };
    const engine = buildEngine(evaluator);
    const unordered = [candle(2, 90), candle(0, 100), candle(1, 110)];

    const first = await engine.replay({
      workspaceId: 'workspace-1',
      dataset: DATASET,
      strategy: STRATEGY,
      candles: unordered,
    });
    const second = await engine.replay({
      workspaceId: 'workspace-1',
      dataset: DATASET,
      strategy: STRATEGY,
      candles: unordered,
    });

    expect(visibleWindows.slice(0, 3).map((window) => window.length)).toEqual([1, 2, 3]);
    expect(visibleWindows[0]).toEqual(['2026-01-01T00:00:00.000Z']);
    expect(first.trades).toHaveLength(1);
    expect(first.trades[0]).toMatchObject({
      status: 'CLOSED',
      entryPrice: 100,
      exitPrice: 90,
      quantity: 2,
      profitLoss: -20,
    });
    expect(first.signalStats).toMatchObject({ buy: 2, sell: 1, ignored: 1, duplicates: 0 });
    expect(first.validation).toMatchObject({
      passed: true,
      chronologicalReplay: true,
      noFutureDataLeakage: true,
      noDuplicateCandles: true,
      noDuplicateTrades: true,
      processedCandles: 3,
    });
    expect(second.trades).toEqual(first.trades);
    expect(second.metrics).toEqual(first.metrics);
    expect(second.validation.resultHash).toBe(first.validation.resultHash);
  });

  it('isolates strategy executions and rejects duplicate candle timestamps', async () => {
    const evaluator: StrategyEvaluator = {
      id: 'sequence',
      evaluate: async ({ candles }) => ({
        signal: candles.length === 1 ? 'BUY' : 'SELL',
        confidence: 1,
        metadata: {},
      }),
    };
    const engine = buildEngine(evaluator);
    const candles = [candle(0, 100), candle(1, 105)];
    const first = await engine.replay({
      workspaceId: 'workspace-1',
      dataset: DATASET,
      strategy: STRATEGY,
      candles,
    });
    const other = await engine.replay({
      workspaceId: 'workspace-1',
      dataset: DATASET,
      strategy: { ...STRATEGY, id: 'strategy-2' },
      candles,
    });

    expect(first.trades).toHaveLength(1);
    expect(other.trades).toHaveLength(1);
    expect(first.trades[0].tradeId).not.toBe(other.trades[0].tradeId);
    await expect(
      engine.replay({
        workspaceId: 'workspace-1',
        dataset: DATASET,
        strategy: STRATEGY,
        candles: [candles[0], candles[0]],
      }),
    ).rejects.toThrow(/duplicate candle timestamps/i);
  });
});

function buildEngine(evaluator: StrategyEvaluator): HistoricalReplayEngine {
  const registry = new SignalEvaluatorRegistry();
  registry.register(evaluator);
  return new HistoricalReplayEngine(new StrategyRunner(registry));
}

function candle(hour: number, close: number): Candle {
  const openTime = new Date(Date.UTC(2026, 0, 1, hour)).toISOString();
  const closeTime = new Date(Date.UTC(2026, 0, 1, hour + 1)).toISOString();
  return Object.freeze({
    symbol: 'BTCUSDT',
    timeframe: Timeframe.H1,
    openTime,
    closeTime,
    open: close,
    high: close + 5,
    low: close - 5,
    close,
    volume: 10,
  });
}
