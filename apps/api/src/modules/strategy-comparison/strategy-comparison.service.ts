import { Injectable } from '@nestjs/common';
import type { BacktestResult } from '../backtesting/backtest-result';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';
import type { StrategyComparisonInput } from './strategy-comparison-input';
import type {
  StrategyComparison,
  StrategyComparisonEntry,
  StrategyComparisonRankings,
} from './strategy-comparison';

const WEIGHT_RETURN = 0.4;
const WEIGHT_DRAWDOWN = 0.3;
const WEIGHT_PROFIT_FACTOR = 0.2;
const WEIGHT_WIN_RATE = 0.1;

type MetricRow = {
  strategyId: string;
  source: 'backtest' | 'walk-forward';
  processedBars: number;
  totalTrades: number;
  netProfit: number;
  totalReturn: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  cagr: number | null;
  durationMs: number;
};

/**
 * Compares multiple BacktestResult / WalkForwardResult outcomes (US123).
 * Produces rankings + weighted overall winner. No optimization / UI / REST / Prisma.
 */
@Injectable()
export class StrategyComparisonService {
  compare(inputs: readonly StrategyComparisonInput[]): StrategyComparison {
    if (inputs.length === 0) {
      return freezeComparison({
        entries: [],
        rankings: {
          highestReturn: [],
          lowestDrawdown: [],
          bestProfitFactor: [],
          highestWinRate: [],
        },
        overallWinnerStrategyId: null,
      });
    }

    const seen = new Set<string>();
    const rows: MetricRow[] = [];

    for (const input of inputs) {
      assertNonEmpty(input.strategyId, 'strategyId');
      const id = input.strategyId.trim();
      if (seen.has(id)) {
        throw new Error(`Duplicate strategyId in comparison: ${id}`);
      }
      seen.add(id);
      rows.push(toMetricRow(id, input.result));
    }

    const returnScores = normalizeHigherBetter(rows.map((row) => row.totalReturn));
    const drawdownScores = normalizeLowerBetter(rows.map((row) => row.maxDrawdown));
    const profitFactorScores = normalizeHigherBetter(
      rows.map((row) => finiteProfitFactor(row.profitFactor)),
    );
    const winRateScores = normalizeHigherBetter(rows.map((row) => row.winRate));

    const entries: StrategyComparisonEntry[] = rows.map((row, index) =>
      Object.freeze({
        strategyId: row.strategyId,
        source: row.source,
        processedBars: row.processedBars,
        totalTrades: row.totalTrades,
        netProfit: row.netProfit,
        totalReturn: row.totalReturn,
        maxDrawdown: row.maxDrawdown,
        winRate: row.winRate,
        profitFactor: row.profitFactor,
        cagr: row.cagr,
        durationMs: row.durationMs,
        weightedScore:
          WEIGHT_RETURN * returnScores[index]! +
          WEIGHT_DRAWDOWN * drawdownScores[index]! +
          WEIGHT_PROFIT_FACTOR * profitFactorScores[index]! +
          WEIGHT_WIN_RATE * winRateScores[index]!,
      }),
    );

    const rankings: StrategyComparisonRankings = Object.freeze({
      highestReturn: rankIds(entries, (a, b) => b.totalReturn - a.totalReturn),
      lowestDrawdown: rankIds(entries, (a, b) => a.maxDrawdown - b.maxDrawdown),
      bestProfitFactor: rankIds(entries, (a, b) =>
        compareProfitFactor(b.profitFactor, a.profitFactor),
      ),
      highestWinRate: rankIds(entries, (a, b) => b.winRate - a.winRate),
    });

    const byScore = [...entries].sort((a, b) => b.weightedScore - a.weightedScore);
    const overallWinnerStrategyId = byScore[0]?.strategyId ?? null;

    return freezeComparison({
      entries: Object.freeze(entries),
      rankings,
      overallWinnerStrategyId,
    });
  }
}

function toMetricRow(strategyId: string, result: BacktestResult | WalkForwardResult): MetricRow {
  if (isWalkForwardResult(result)) {
    return fromWalkForward(strategyId, result);
  }
  return fromBacktest(strategyId, result);
}

function isWalkForwardResult(
  result: BacktestResult | WalkForwardResult,
): result is WalkForwardResult {
  return 'windowResults' in result && 'totalWindows' in result;
}

function fromBacktest(strategyId: string, result: BacktestResult): MetricRow {
  const perf = result.performance;
  return {
    strategyId,
    source: 'backtest',
    processedBars: result.processedBars,
    totalTrades: result.totalTrades,
    netProfit: perf.netProfit,
    totalReturn: perf.totalReturnPct,
    maxDrawdown: perf.maxDrawdown,
    winRate: perf.winRate,
    profitFactor: perf.profitFactor,
    cagr: perf.cagr,
    durationMs: result.durationMs,
  };
}

function fromWalkForward(strategyId: string, result: WalkForwardResult): MetricRow {
  const windows = result.windowResults.map((item) => item.result);
  const performances = windows.map((item) => item.performance);

  const totalTrades = windows.reduce((sum, item) => sum + item.totalTrades, 0);
  const netProfit = performances.reduce((sum, item) => sum + item.netProfit, 0);
  const totalReturn = average(performances.map((item) => item.totalReturnPct));
  const maxDrawdown = max(performances.map((item) => item.maxDrawdown));
  const winRate = average(performances.map((item) => item.winRate));
  const profitFactor = averageFiniteProfitFactors(performances.map((item) => item.profitFactor));
  const cagrValues = performances
    .map((item) => item.cagr)
    .filter((value): value is number => value !== null);
  const cagr = cagrValues.length === 0 ? null : average(cagrValues);

  return {
    strategyId,
    source: 'walk-forward',
    processedBars: result.totalProcessedBars,
    totalTrades,
    netProfit,
    totalReturn,
    maxDrawdown,
    winRate,
    profitFactor,
    cagr,
    durationMs: result.durationMs,
  };
}

function averageFiniteProfitFactors(values: readonly number[]): number {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return values.some((value) => value === Number.POSITIVE_INFINITY)
      ? Number.POSITIVE_INFINITY
      : 0;
  }
  return average(finite);
}

function normalizeHigherBetter(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const maxValue = Math.max(...values);
  if (min === maxValue) return values.map(() => 1);
  return values.map((value) => (value - min) / (maxValue - min));
}

function normalizeLowerBetter(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const maxValue = Math.max(...values);
  if (min === maxValue) return values.map(() => 1);
  return values.map((value) => 1 - (value - min) / (maxValue - min));
}

function finiteProfitFactor(value: number): number {
  if (!Number.isFinite(value)) {
    return value === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : 0;
  }
  return value;
}

function compareProfitFactor(a: number, b: number): number {
  return finiteProfitFactor(a) - finiteProfitFactor(b);
}

function rankIds(
  entries: readonly StrategyComparisonEntry[],
  compare: (a: StrategyComparisonEntry, b: StrategyComparisonEntry) => number,
): readonly string[] {
  return Object.freeze([...entries].sort(compare).map((entry) => entry.strategyId));
}

function freezeComparison(comparison: StrategyComparison): StrategyComparison {
  return Object.freeze({
    entries: Object.freeze([...comparison.entries]),
    rankings: Object.freeze({
      highestReturn: Object.freeze([...comparison.rankings.highestReturn]),
      lowestDrawdown: Object.freeze([...comparison.rankings.lowestDrawdown]),
      bestProfitFactor: Object.freeze([...comparison.rankings.bestProfitFactor]),
      highestWinRate: Object.freeze([...comparison.rankings.highestWinRate]),
    }),
    overallWinnerStrategyId: comparison.overallWinnerStrategyId,
  });
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function max(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
