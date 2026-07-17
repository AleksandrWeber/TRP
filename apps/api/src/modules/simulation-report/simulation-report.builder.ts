import { Injectable } from '@nestjs/common';
import type { PortfolioSnapshot } from '../portfolio/portfolio-snapshot';
import type { SimulationReportBuildInput } from './simulation-report-build-input';
import type {
  PortfolioSnapshotsSummary,
  SimulationReport,
  TradeSummary,
} from './simulation-report';

/**
 * Assembles an immutable SimulationReport from research simulation outputs (US124).
 * BacktestEngine remains unaware of report internals.
 */
@Injectable()
export class SimulationReportBuilder {
  build(input: SimulationReportBuildInput): SimulationReport {
    assertNonEmpty(input.session.strategyId, 'strategyId');
    assertNonEmpty(input.session.workspaceId, 'workspaceId');
    assertNonEmpty(String(input.session.instrument), 'instrument');
    assertNonEmpty(input.session.from, 'from');
    assertNonEmpty(input.session.to, 'to');

    if (input.comparisonScore !== undefined && !Number.isFinite(input.comparisonScore)) {
      throw new Error('comparisonScore must be a finite number when provided');
    }

    const openTrades = input.openTrades.length;
    const closedTrades = input.closedTrades.length;
    const tradingSummary: TradeSummary = Object.freeze({
      totalTrades: openTrades + closedTrades,
      openTrades,
      closedTrades,
    });

    const report: SimulationReport = {
      session: Object.freeze({
        strategyId: input.session.strategyId.trim(),
        workspaceId: input.session.workspaceId.trim(),
        instrument: input.session.instrument,
        timeframe: input.session.timeframe,
        from: input.session.from,
        to: input.session.to,
      }),
      execution: Object.freeze({
        backtest: input.backtest,
        ...(input.walkForward !== undefined ? { walkForward: input.walkForward } : {}),
      }),
      portfolio: Object.freeze({
        final: Object.freeze({ ...input.portfolio }),
        snapshotsSummary: summarizeSnapshots(input.snapshots),
      }),
      trading: Object.freeze({
        summary: tradingSummary,
      }),
      performance: input.backtest.performance,
      ...(input.comparisonScore !== undefined ? { comparisonScore: input.comparisonScore } : {}),
      generatedAt: input.generatedAt ?? new Date().toISOString(),
    };

    return freezeReport(report);
  }
}

function summarizeSnapshots(snapshots: readonly PortfolioSnapshot[]): PortfolioSnapshotsSummary {
  if (snapshots.length === 0) {
    return Object.freeze({
      count: 0,
      firstTimestamp: null,
      lastTimestamp: null,
      startingEquity: null,
      endingEquity: null,
      peakEquity: null,
      troughEquity: null,
    });
  }

  const ordered = [...snapshots].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const equities = ordered.map((item) => item.equity);

  return Object.freeze({
    count: ordered.length,
    firstTimestamp: ordered[0]!.timestamp,
    lastTimestamp: ordered[ordered.length - 1]!.timestamp,
    startingEquity: ordered[0]!.equity,
    endingEquity: ordered[ordered.length - 1]!.equity,
    peakEquity: Math.max(...equities),
    troughEquity: Math.min(...equities),
  });
}

function freezeReport(report: SimulationReport): SimulationReport {
  return Object.freeze({
    session: report.session,
    execution: report.execution,
    portfolio: report.portfolio,
    trading: report.trading,
    performance: report.performance,
    ...(report.comparisonScore !== undefined ? { comparisonScore: report.comparisonScore } : {}),
    generatedAt: report.generatedAt,
  });
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
