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

    const orderedSnapshots = chronologicalSnapshots(input.snapshots);
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
    const { maxDrawdown, maxDrawdownPct, maxDrawdownFraction } =
      computeMaxDrawdown(orderedSnapshots);
    const volatility = computeVolatility(orderedSnapshots);
    const returns = adjacentSimpleReturns(orderedSnapshots);
    const sharpeRatio = computeSharpeRatio(returns);
    const sortinoRatio = computeSortinoRatio(returns);
    const calmarRatio = computeCalmarRatio(cagr, maxDrawdownFraction);

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
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
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
  /** Largest peak-to-trough decline as a fraction of that peak. */
  maxDrawdownFraction: number;
} {
  if (snapshots.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPct: 0, maxDrawdownFraction: 0 };
  }

  let peak = snapshots[0]!.equity;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownFraction = 0;

  for (const snapshot of snapshots) {
    if (snapshot.equity > peak) {
      peak = snapshot.equity;
    }
    const drawdown = peak - snapshot.equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPct = peak === 0 ? 0 : (drawdown / Math.abs(peak)) * 100;
    }
    if (Number.isFinite(peak) && peak !== 0 && Number.isFinite(snapshot.equity)) {
      const fraction = (peak - snapshot.equity) / Math.abs(peak);
      if (Number.isFinite(fraction) && fraction > maxDrawdownFraction) {
        maxDrawdownFraction = fraction;
      }
    }
  }

  return { maxDrawdown, maxDrawdownPct, maxDrawdownFraction };
}

/**
 * Chronological copy. Equal timestamps keep their input order.
 * The caller-owned snapshot array is left unchanged.
 */
function chronologicalSnapshots(snapshots: readonly PortfolioSnapshot[]): PortfolioSnapshot[] {
  return [...snapshots].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Adjacent simple returns. Prior equity must be finite and positive, and the
 * current equity and the return must be finite.
 */
function adjacentSimpleReturns(snapshots: readonly PortfolioSnapshot[]): number[] {
  const returns: number[] = [];
  for (let index = 1; index < snapshots.length; index += 1) {
    const previous = snapshots[index - 1]!.equity;
    const current = snapshots[index]!.equity;
    if (!Number.isFinite(previous) || previous <= 0 || !Number.isFinite(current)) continue;
    const change = (current - previous) / previous;
    if (Number.isFinite(change)) returns.push(change);
  }
  return returns;
}

/** Sample standard deviation. Null when n < 2 or the result is non-finite. */
function sampleStandardDeviation(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const average = mean(values);
  const variance = sum(values.map((value) => (value - average) ** 2)) / (values.length - 1);
  const deviation = Math.sqrt(variance);
  return Number.isFinite(deviation) ? deviation : null;
}

/** Risk-free rate is zero. Not annualized. */
function computeSharpeRatio(returns: readonly number[]): number | null {
  const deviation = sampleStandardDeviation(returns);
  if (deviation === null || deviation === 0) return null;
  return finiteRatio(mean(returns), deviation);
}

/**
 * Target return is zero. Downside deviation uses every valid return:
 * negative returns contribute themselves, other returns contribute zero.
 */
function computeSortinoRatio(returns: readonly number[]): number | null {
  if (returns.length === 0) return null;
  const downsideSquareSum = sum(returns.map((value) => (value < 0 ? value * value : 0)));
  const downsideDeviation = Math.sqrt(downsideSquareSum / returns.length);
  if (!Number.isFinite(downsideDeviation) || downsideDeviation === 0) return null;
  return finiteRatio(mean(returns), downsideDeviation);
}

/** CAGR / fractional max drawdown. A zero or missing input is unavailable. */
function computeCalmarRatio(cagr: number | null, maxDrawdownFraction: number): number | null {
  if (cagr === null || cagr === 0) return null;
  return finiteRatio(cagr, maxDrawdownFraction);
}

function finiteRatio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const ratio = numerator / denominator;
  return Number.isFinite(ratio) ? ratio : null;
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
