import { Injectable } from '@nestjs/common';
import type { PortfolioSnapshot } from '../portfolio/portfolio-snapshot';
import type { Trade } from '../trade/trade';
import { TradeSide } from '../trade/trade-side';
import type { PerformanceReport } from './performance-report';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Timing / count summary for performance analysis (US122 / US125).
 * Kept in the Performance module so Performance does not import Backtesting
 * (avoids Backtesting ↔ Performance cycles).
 */
export type BacktestRunSummary = {
  processedBars: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
};

/**
 * Inputs for PerformanceAnalyzer (US122).
 * `backtest` is the run summary without the nested performance report.
 */
export type PerformanceAnalyzerInput = {
  backtest: BacktestRunSummary;
  closedTrades: readonly Trade[];
  snapshots: readonly PortfolioSnapshot[];
  initialCapital: number;
};

/**
 * Calculates standardized performance metrics from a completed backtest (US122).
 * No optimization / reporting UI / REST / Prisma.
 */
@Injectable()
export class PerformanceAnalyzer {
  analyze(input: PerformanceAnalyzerInput): PerformanceReport {
    assertFiniteNumber(input.initialCapital, 'initialCapital');

    const orderedSnapshots = [...input.snapshots].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
    const initialEquity =
      orderedSnapshots.length > 0 ? orderedSnapshots[0]!.equity : input.initialCapital;
    const finalEquity =
      orderedSnapshots.length > 0
        ? orderedSnapshots[orderedSnapshots.length - 1]!.equity
        : input.initialCapital;

    const netProfit = finalEquity - initialEquity;
    const totalReturnPct = initialEquity === 0 ? 0 : (netProfit / Math.abs(initialEquity)) * 100;

    const startedAtMs = Date.parse(input.backtest.startedAt);
    const finishedAtMs = Date.parse(input.backtest.finishedAt);
    const wallClockDurationMs =
      Number.isFinite(startedAtMs) && Number.isFinite(finishedAtMs)
        ? Math.max(0, finishedAtMs - startedAtMs)
        : input.backtest.durationMs;

    // Prefer equity-curve / bar-span duration for CAGR so repeated runs are deterministic.
    const curveStart =
      orderedSnapshots.length > 0 ? Date.parse(orderedSnapshots[0]!.timestamp) : NaN;
    const curveEnd =
      orderedSnapshots.length > 0
        ? Date.parse(orderedSnapshots[orderedSnapshots.length - 1]!.timestamp)
        : NaN;
    const curveDurationMs =
      Number.isFinite(curveStart) && Number.isFinite(curveEnd) && curveEnd >= curveStart
        ? curveEnd - curveStart
        : NaN;
    const durationMs =
      Number.isFinite(curveDurationMs) && curveDurationMs > 0
        ? curveDurationMs
        : wallClockDurationMs;

    const cagr = computeCagr(initialEquity, finalEquity, durationMs);
    const { maxDrawdown, maxDrawdownPct } = computeMaxDrawdown(orderedSnapshots);
    const volatility = computeVolatility(orderedSnapshots);

    const tradePnls = input.closedTrades.map(tradePnL);
    const wins = tradePnls.filter((pnl) => pnl > 0);
    const losses = tradePnls.filter((pnl) => pnl < 0);
    const totalTrades = input.closedTrades.length;
    const winningTrades = wins.length;
    const losingTrades = losses.length;
    const winRate = totalTrades === 0 ? 0 : winningTrades / totalTrades;
    const averageWin = wins.length === 0 ? 0 : mean(wins);
    const averageLoss = losses.length === 0 ? 0 : Math.abs(mean(losses));
    const grossWins = sum(wins);
    const grossLossAbs = Math.abs(sum(losses));
    const profitFactor =
      grossLossAbs === 0
        ? grossWins > 0
          ? Number.POSITIVE_INFINITY
          : 0
        : grossWins / grossLossAbs;

    const durations = input.closedTrades
      .map(tradeDurationMs)
      .filter((value): value is number => value !== null);
    const averageTradeDurationMs = durations.length === 0 ? 0 : mean(durations);

    return Object.freeze({
      netProfit,
      totalReturnPct,
      cagr,
      maxDrawdown,
      maxDrawdownPct,
      volatility,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      averageTradeDurationMs,
    });
  }
}

function tradePnL(trade: Trade): number {
  const exit = trade.exitPrice;
  if (exit === undefined) return 0;
  return trade.side === TradeSide.Buy
    ? (exit - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - exit) * trade.quantity;
}

function tradeDurationMs(trade: Trade): number | null {
  if (!trade.exitTimestamp) return null;
  const start = Date.parse(trade.entryTimestamp);
  const end = Date.parse(trade.exitTimestamp);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}

function computeCagr(
  initialEquity: number,
  finalEquity: number,
  durationMs: number,
): number | null {
  if (durationMs <= 0 || initialEquity <= 0 || finalEquity <= 0) return null;
  const years = durationMs / MS_PER_YEAR;
  if (years <= 0) return null;
  return Math.pow(finalEquity / initialEquity, 1 / years) - 1;
}

function computeMaxDrawdown(snapshots: readonly PortfolioSnapshot[]): {
  maxDrawdown: number;
  maxDrawdownPct: number;
} {
  if (snapshots.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPct: 0 };
  }

  let peak = snapshots[0]!.equity;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  for (const snapshot of snapshots) {
    if (snapshot.equity > peak) {
      peak = snapshot.equity;
    }
    const drawdown = peak - snapshot.equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPct = peak === 0 ? 0 : (drawdown / Math.abs(peak)) * 100;
    }
  }

  return { maxDrawdown, maxDrawdownPct };
}

function computeVolatility(snapshots: readonly PortfolioSnapshot[]): number {
  if (snapshots.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < snapshots.length; i += 1) {
    const prev = snapshots[i - 1]!.equity;
    const curr = snapshots[i]!.equity;
    if (prev === 0) continue;
    returns.push((curr - prev) / prev);
  }

  if (returns.length < 2) {
    return returns.length === 1 ? 0 : 0;
  }

  const avg = mean(returns);
  const variance = sum(returns.map((r) => (r - avg) ** 2)) / (returns.length - 1);
  return Math.sqrt(variance);
}

function mean(values: readonly number[]): number {
  return sum(values) / values.length;
}

function sum(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function assertFiniteNumber(value: number, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}
