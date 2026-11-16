import { Injectable } from '@nestjs/common';
import type { SimulationReport } from './simulation-report';

/**
 * One-row CSV summary of a SimulationReport.
 * Nested bars, trades, and equity snapshots stay on the in-memory artifact.
 */
const CSV_COLUMNS = [
  'strategyId',
  'workspaceId',
  'instrument',
  'timeframe',
  'from',
  'to',
  'backtestStatus',
  'processedBars',
  'backtestStartedAt',
  'backtestFinishedAt',
  'backtestDurationMs',
  'hasWalkForward',
  'portfolioId',
  'portfolioStatus',
  'initialCapital',
  'currentCapital',
  'equity',
  'cash',
  'snapshotCount',
  'firstSnapshotTimestamp',
  'lastSnapshotTimestamp',
  'startingEquity',
  'endingEquity',
  'peakEquity',
  'troughEquity',
  'summaryTotalTrades',
  'summaryOpenTrades',
  'summaryClosedTrades',
  'netProfit',
  'totalReturnPct',
  'cagr',
  'maxDrawdown',
  'maxDrawdownPct',
  'volatility',
  'sharpeRatio',
  'sortinoRatio',
  'calmarRatio',
  'performanceTotalTrades',
  'winningTrades',
  'losingTrades',
  'winRate',
  'averageWin',
  'averageLoss',
  'profitFactor',
  'averageTradeDurationMs',
  'comparisonScore',
  'generatedAt',
] as const;

type CsvColumn = (typeof CSV_COLUMNS)[number];

@Injectable()
export class CsvSimulationReportExporter {
  export(report: SimulationReport): string {
    const cells = toCells(report);
    const row = CSV_COLUMNS.map((column) => escapeCsvField(cells[column]));
    return `${CSV_COLUMNS.join(',')}\n${row.join(',')}`;
  }
}

function toCells(report: SimulationReport): Record<CsvColumn, string> {
  const { session, execution, portfolio, trading, performance } = report;
  return {
    strategyId: session.strategyId,
    workspaceId: session.workspaceId,
    instrument: String(session.instrument),
    timeframe: session.timeframe,
    from: session.from,
    to: session.to,
    backtestStatus: execution.backtest.status,
    processedBars: String(execution.backtest.processedBars),
    backtestStartedAt: execution.backtest.startedAt,
    backtestFinishedAt: execution.backtest.finishedAt,
    backtestDurationMs: String(execution.backtest.durationMs),
    hasWalkForward: execution.walkForward === undefined ? 'false' : 'true',
    portfolioId: portfolio.final.id,
    portfolioStatus: portfolio.final.status,
    initialCapital: String(portfolio.final.initialCapital),
    currentCapital: String(portfolio.final.currentCapital),
    equity: String(portfolio.final.equity),
    cash: String(portfolio.final.cash),
    snapshotCount: String(portfolio.snapshotsSummary.count),
    firstSnapshotTimestamp: portfolio.snapshotsSummary.firstTimestamp ?? '',
    lastSnapshotTimestamp: portfolio.snapshotsSummary.lastTimestamp ?? '',
    startingEquity: formatNullableNumber(portfolio.snapshotsSummary.startingEquity),
    endingEquity: formatNullableNumber(portfolio.snapshotsSummary.endingEquity),
    peakEquity: formatNullableNumber(portfolio.snapshotsSummary.peakEquity),
    troughEquity: formatNullableNumber(portfolio.snapshotsSummary.troughEquity),
    summaryTotalTrades: String(trading.summary.totalTrades),
    summaryOpenTrades: String(trading.summary.openTrades),
    summaryClosedTrades: String(trading.summary.closedTrades),
    netProfit: String(performance.netProfit),
    totalReturnPct: String(performance.totalReturnPct),
    cagr: formatNullableNumber(performance.cagr),
    maxDrawdown: String(performance.maxDrawdown),
    maxDrawdownPct: String(performance.maxDrawdownPct),
    volatility: String(performance.volatility),
    sharpeRatio: formatNullableNumber(performance.sharpeRatio),
    sortinoRatio: formatNullableNumber(performance.sortinoRatio),
    calmarRatio: formatNullableNumber(performance.calmarRatio),
    performanceTotalTrades: String(performance.totalTrades),
    winningTrades: String(performance.winningTrades),
    losingTrades: String(performance.losingTrades),
    winRate: String(performance.winRate),
    averageWin: String(performance.averageWin),
    averageLoss: String(performance.averageLoss),
    profitFactor: String(performance.profitFactor),
    averageTradeDurationMs: String(performance.averageTradeDurationMs),
    comparisonScore: formatNullableNumber(report.comparisonScore),
    generatedAt: report.generatedAt,
  };
}

function formatNullableNumber(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? '' : String(value);
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
