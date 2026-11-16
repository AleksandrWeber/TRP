import { describe, expect, it } from 'vitest';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { BacktestResult } from '../backtesting/backtest-result';
import { toInstrument } from '../market-data/instrument';
import { Timeframe } from '../market-data/timeframe';
import type { PerformanceReport } from '../performance/performance-report';
import { toPortfolioId } from '../portfolio/portfolio-id';
import { PortfolioStatus } from '../portfolio/portfolio-status';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';
import { CsvSimulationReportExporter } from './csv-simulation-report.exporter';
import type { SimulationReport } from './simulation-report';

function performance(overrides: Partial<PerformanceReport> = {}): PerformanceReport {
  return {
    netProfit: 120.5,
    totalReturnPct: 1.205,
    cagr: 0.42,
    maxDrawdown: 40,
    maxDrawdownPct: 0.4,
    volatility: 0.02,
    sharpeRatio: 1.1,
    sortinoRatio: 1.4,
    calmarRatio: 0.8,
    totalTrades: 2,
    winningTrades: 1,
    losingTrades: 1,
    winRate: 0.5,
    averageWin: 150,
    averageLoss: 29.5,
    profitFactor: 5.08,
    averageTradeDurationMs: 3_600_000,
    ...overrides,
  };
}

function backtest(metrics: PerformanceReport): BacktestResult {
  return {
    processedBars: 3,
    startedAt: '2026-07-17T10:00:00.000Z',
    finishedAt: '2026-07-17T12:00:00.000Z',
    durationMs: 7_200_000,
    status: BacktestStatus.Completed,
    totalTrades: 2,
    openTrades: 0,
    closedTrades: 2,
    performance: metrics,
  };
}

function walkForward(): WalkForwardResult {
  return {
    totalWindows: 1,
    completedWindows: 1,
    failedWindows: 0,
    totalProcessedBars: 3,
    startedAt: '2026-07-17T10:00:00.000Z',
    finishedAt: '2026-07-17T12:00:00.000Z',
    durationMs: 7_200_000,
    windowResults: [],
  };
}

function report(overrides: Partial<SimulationReport> = {}): SimulationReport {
  const metrics = performance();
  const base: SimulationReport = {
    session: {
      strategyId: 'donchian-breakout',
      workspaceId: 'ws-1',
      instrument: toInstrument('BTCUSDT'),
      timeframe: Timeframe.H1,
      from: '2026-07-17T10:00:00.000Z',
      to: '2026-07-17T12:00:00.000Z',
    },
    execution: {
      backtest: backtest(metrics),
      walkForward: walkForward(),
    },
    portfolio: {
      final: {
        id: toPortfolioId('pf-1'),
        workspaceId: 'ws-1',
        initialCapital: 10_000,
        currentCapital: 10_120.5,
        equity: 10_120.5,
        cash: 10_120.5,
        status: PortfolioStatus.Closed,
      },
      snapshotsSummary: {
        count: 3,
        firstTimestamp: '2026-07-17T10:00:00.000Z',
        lastTimestamp: '2026-07-17T12:00:00.000Z',
        startingEquity: 10_000,
        endingEquity: 10_120.5,
        peakEquity: 10_150,
        troughEquity: 9_960,
      },
    },
    trading: {
      summary: {
        totalTrades: 2,
        openTrades: 0,
        closedTrades: 2,
      },
    },
    performance: metrics,
    comparisonScore: 0.91,
    generatedAt: '2026-07-17T12:00:01.000Z',
  };

  return {
    ...base,
    ...overrides,
    session: { ...base.session, ...overrides.session },
    execution: overrides.execution ?? base.execution,
    portfolio: overrides.portfolio ?? base.portfolio,
    trading: overrides.trading ?? base.trading,
    performance: overrides.performance ?? base.performance,
  };
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (inQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowByHeader(content: string): Record<string, string> {
  const [header, data] = parseCsv(content);
  expect(header).toBeDefined();
  expect(data).toBeDefined();
  expect(header).toHaveLength(data?.length);
  return Object.fromEntries((header ?? []).map((column, index) => [column, data?.[index] ?? '']));
}

describe('CsvSimulationReportExporter', () => {
  const exporter = new CsvSimulationReportExporter();

  it('exports one header row and one summary row', () => {
    const cells = rowByHeader(exporter.export(report()));

    expect(cells.strategyId).toBe('donchian-breakout');
    expect(cells.workspaceId).toBe('ws-1');
    expect(cells.instrument).toBe('BTCUSDT');
    expect(cells.timeframe).toBe(Timeframe.H1);
    expect(cells.backtestStatus).toBe(BacktestStatus.Completed);
    expect(cells.processedBars).toBe('3');
    expect(cells.hasWalkForward).toBe('true');
    expect(cells.portfolioId).toBe('pf-1');
    expect(cells.portfolioStatus).toBe(PortfolioStatus.Closed);
    expect(cells.initialCapital).toBe('10000');
    expect(cells.equity).toBe('10120.5');
    expect(cells.snapshotCount).toBe('3');
    expect(cells.peakEquity).toBe('10150');
    expect(cells.troughEquity).toBe('9960');
    expect(cells.summaryTotalTrades).toBe('2');
    expect(cells.summaryClosedTrades).toBe('2');
    expect(cells.netProfit).toBe('120.5');
    expect(cells.sharpeRatio).toBe('1.1');
    expect(cells.sortinoRatio).toBe('1.4');
    expect(cells.calmarRatio).toBe('0.8');
    expect(cells.performanceTotalTrades).toBe('2');
    expect(cells.comparisonScore).toBe('0.91');
    expect(cells.generatedAt).toBe('2026-07-17T12:00:01.000Z');
    expect(parseCsv(exporter.export(report()))).toHaveLength(2);
  });

  it('leaves unavailable ratios and an absent comparison score empty', () => {
    const source = report({
      execution: { backtest: backtest(performance()) },
      performance: performance({
        cagr: null,
        sharpeRatio: null,
        sortinoRatio: null,
        calmarRatio: null,
      }),
      comparisonScore: undefined,
      portfolio: {
        final: {
          id: toPortfolioId('pf-1'),
          workspaceId: 'ws-1',
          initialCapital: 10_000,
          currentCapital: 10_000,
          equity: 10_000,
          cash: 10_000,
          status: PortfolioStatus.Active,
        },
        snapshotsSummary: {
          count: 0,
          firstTimestamp: null,
          lastTimestamp: null,
          startingEquity: null,
          endingEquity: null,
          peakEquity: null,
          troughEquity: null,
        },
      },
    });

    const cells = rowByHeader(exporter.export(source));

    expect(cells.hasWalkForward).toBe('false');
    expect(cells.cagr).toBe('');
    expect(cells.sharpeRatio).toBe('');
    expect(cells.sortinoRatio).toBe('');
    expect(cells.calmarRatio).toBe('');
    expect(cells.comparisonScore).toBe('');
    expect(cells.firstSnapshotTimestamp).toBe('');
    expect(cells.startingEquity).toBe('');
    expect(cells.peakEquity).toBe('');
  });

  it('escapes commas, quotes, and newlines without changing the report', () => {
    const source = report({
      session: {
        strategyId: 'alpha,beta',
        workspaceId: 'say "hi"',
        instrument: toInstrument('ETHUSDT'),
        timeframe: Timeframe.D1,
        from: '2026-01-01T00:00:00.000Z\nnote',
        to: '2026-01-02T00:00:00.000Z',
      },
    });
    const before = JSON.stringify(source);

    const cells = rowByHeader(exporter.export(source));

    expect(cells.strategyId).toBe('alpha,beta');
    expect(cells.workspaceId).toBe('say "hi"');
    expect(cells.from).toBe('2026-01-01T00:00:00.000Z\nnote');
    expect(JSON.stringify(source)).toBe(before);
  });
});
