import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { ExecutorPortfolioStore, executeVirtualSignal } from '../paper-trading-executor';
import { StrategyRunner } from '../signal-engine';
import { InsufficientIndicatorInputError } from '../technical-indicators';
import type {
  HistoricalReplayInput,
  HistoricalReplayResult,
  ResearchPerformanceMetrics,
} from './domain/historical-research';

@Injectable()
export class HistoricalReplayEngine {
  constructor(private readonly runner: StrategyRunner) {}

  async replay(input: HistoricalReplayInput): Promise<HistoricalReplayResult> {
    this.assertCompatible(input);
    const startedAt = performance.now();
    const ordered = [...input.candles].sort((left, right) =>
      left.openTime.localeCompare(right.openTime),
    );
    assertUniqueTimestamps(ordered.map((candle) => candle.openTime));

    // A fresh store per replay is the isolation boundary. The same shared
    // execution state machine used by Paper Trading operates on this store.
    const store = new ExecutorPortfolioStore();
    const stateWorkspaceId = `${input.workspaceId}::${input.dataset.datasetId}`;
    let warmupCandles = 0;
    let evaluatedCandles = 0;
    let tradeSequence = 0;
    let maxDrawdown = 0;
    let peakPnl = 0;

    for (let index = 0; index < ordered.length; index += 1) {
      const candle = ordered[index];
      // The evaluator receives only the prefix ending at the current closed
      // candle. Later candles are unreachable by construction.
      const visibleCandles = Object.freeze(ordered.slice(0, index + 1));
      try {
        const result = await this.runner.run(input.strategy, visibleCandles, candle.closeTime);
        await executeVirtualSignal({
          workspaceId: stateWorkspaceId,
          strategyId: input.strategy.id,
          result,
          store,
          resolvePrice: async () => candle.close,
          resolveQuantity: async () => input.strategy.positionSize,
          createTradeId: () => {
            tradeSequence += 1;
            return deterministicTradeId(
              input.dataset.contentHash,
              input.strategy.id,
              input.strategy.tradingPair,
              candle.closeTime,
              tradeSequence,
            );
          },
        });
        evaluatedCandles += 1;
        const currentPnl = portfolioPnl(store, stateWorkspaceId, input.strategy.id, candle.close);
        peakPnl = Math.max(peakPnl, currentPnl);
        maxDrawdown = Math.max(maxDrawdown, peakPnl - currentPnl);
      } catch (error) {
        if (error instanceof InsufficientIndicatorInputError) {
          warmupCandles += 1;
          continue;
        }
        throw error;
      }
    }

    const trades = store.listTrades(stateWorkspaceId, input.strategy.id);
    const signalStats = store.getStats(stateWorkspaceId, input.strategy.id) ?? {
      buy: 0,
      sell: 0,
      hold: 0,
      ignored: 0,
      duplicates: 0,
      failures: 0,
    };
    const metrics = calculateMetrics(trades, maxDrawdown);
    const deterministicPayload = {
      datasetId: input.dataset.datasetId,
      datasetContentHash: input.dataset.contentHash,
      marketRegime: input.dataset.marketRegime,
      strategyId: input.strategy.id,
      strategyParameters: input.strategy.parameters,
      symbol: input.strategy.tradingPair,
      timeframe: input.strategy.timeframe,
      trades,
      signalStats,
      metrics,
      processedCandles: ordered.length,
      evaluatedCandles,
      warmupCandles,
    };
    const resultHash = hashJson(deterministicPayload);
    const duplicateTradeCount = trades.length - new Set(trades.map((trade) => trade.tradeId)).size;

    return Object.freeze({
      dataset: input.dataset,
      strategy: input.strategy,
      symbol: input.strategy.tradingPair,
      timeframe: input.strategy.timeframe,
      trades,
      signalStats: Object.freeze({ ...signalStats }),
      metrics,
      validation: Object.freeze({
        passed: duplicateTradeCount === 0 && signalStats.duplicates === 0,
        chronologicalReplay: true,
        noFutureDataLeakage: true,
        noDuplicateCandles: true,
        noDuplicateTrades: duplicateTradeCount === 0 && signalStats.duplicates === 0,
        processedCandles: ordered.length,
        evaluatedCandles,
        warmupCandles,
        resultHash,
      }),
      executionTimeMs: Math.max(0, Math.round(performance.now() - startedAt)),
    });
  }

  private assertCompatible(input: HistoricalReplayInput): void {
    if (!input.dataset.enabled) throw new Error('Historical dataset is disabled');
    if (!input.dataset.symbols.includes(input.strategy.tradingPair)) {
      throw new Error('Strategy symbol is not present in the historical dataset');
    }
    if (input.dataset.timeframe !== input.strategy.timeframe) {
      throw new Error('Strategy timeframe does not match the historical dataset');
    }
    if (input.candles.length === 0) throw new Error('Historical dataset contains no candles');
    for (const candle of input.candles) {
      if (
        candle.symbol !== input.strategy.tradingPair ||
        candle.timeframe !== input.strategy.timeframe
      ) {
        throw new Error('Historical candle identity does not match the strategy');
      }
    }
  }
}

function calculateMetrics(
  trades: HistoricalReplayResult['trades'],
  maxDrawdown: number,
): ResearchPerformanceMetrics {
  const closed = trades.filter((trade) => trade.status === 'CLOSED');
  const wins = closed.filter((trade) => trade.profitLoss > 0);
  const losses = closed.filter((trade) => trade.profitLoss < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.profitLoss, 0));
  const netProfit = closed.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  return Object.freeze({
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? round8(wins.length / closed.length) : 0,
    netProfit: round8(netProfit),
    profitFactor: round8(profitFactor),
    maxDrawdown: round8(maxDrawdown),
  });
}

function portfolioPnl(
  store: ExecutorPortfolioStore,
  workspaceId: string,
  strategyId: string,
  markPrice: number,
): number {
  const trades = store.listTrades(workspaceId, strategyId);
  return trades.reduce(
    (sum, trade) =>
      sum +
      (trade.status === 'CLOSED'
        ? trade.profitLoss
        : (markPrice - trade.entryPrice) * trade.quantity),
    0,
  );
}

function assertUniqueTimestamps(timestamps: readonly string[]): void {
  if (new Set(timestamps).size !== timestamps.length) {
    throw new Error('Historical dataset contains duplicate candle timestamps');
  }
}

function deterministicTradeId(
  datasetHash: string,
  strategyId: string,
  symbol: string,
  timestamp: string,
  sequence: number,
): string {
  const hex = createHash('sha256')
    .update(`${datasetHash}::${strategyId}::${symbol}::${timestamp}::${sequence}`)
    .digest('hex')
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function round8(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}
