import { Injectable } from '@nestjs/common';
import type { SimulationReport } from './simulation-report';

const UNAVAILABLE = 'Unavailable';

/**
 * Readable HTML summary of a SimulationReport.
 * Nested bars, trades, and equity snapshots stay on the in-memory artifact.
 * Every dynamic value is escaped before it is placed in text or attributes.
 */
@Injectable()
export class HtmlSimulationReportExporter {
  export(report: SimulationReport): string {
    return renderDocument(report);
  }
}

type SummaryField = Readonly<{
  label: string;
  value: string;
}>;

type SummarySection = Readonly<{
  id: string;
  heading: string;
  fields: readonly SummaryField[];
}>;

function renderDocument(report: SimulationReport): string {
  const sections = summarySections(report).map(renderSection).join('\n');
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Simulation report summary</title>',
    '<style>',
    'body { font-family: sans-serif; line-height: 1.45; margin: 1.5rem; }',
    'main { max-width: 44rem; }',
    'section { margin-top: 1.5rem; }',
    'dl { display: grid; grid-template-columns: minmax(10rem, 16rem) 1fr; gap: 0.25rem 1rem; }',
    'dt { font-weight: 600; }',
    'dd { margin: 0; }',
    '</style>',
    '</head>',
    '<body>',
    '<main>',
    '<h1>Simulation report summary</h1>',
    '<p>Summary of one simulation report. Nested bars, trades, and equity snapshots are omitted.</p>',
    sections,
    '</main>',
    '</body>',
    '</html>',
  ].join('\n');
}

function summarySections(report: SimulationReport): readonly SummarySection[] {
  const { session, execution, portfolio, trading, performance } = report;
  const snapshots = portfolio.snapshotsSummary;
  return [
    {
      id: 'session',
      heading: 'Session',
      fields: [
        field('Strategy ID', session.strategyId),
        field('Workspace ID', session.workspaceId),
        field('Instrument', String(session.instrument)),
        field('Timeframe', session.timeframe),
        field('From', session.from),
        field('To', session.to),
      ],
    },
    {
      id: 'backtest',
      heading: 'Backtest',
      fields: [
        field('Status', execution.backtest.status),
        field('Processed bars', String(execution.backtest.processedBars)),
        field('Started at', execution.backtest.startedAt),
        field('Finished at', execution.backtest.finishedAt),
        field('Duration (ms)', String(execution.backtest.durationMs)),
        field('Walk-forward', execution.walkForward === undefined ? 'No' : 'Yes'),
      ],
    },
    {
      id: 'portfolio',
      heading: 'Portfolio',
      fields: [
        field('Portfolio ID', portfolio.final.id),
        field('Status', portfolio.final.status),
        field('Initial capital', String(portfolio.final.initialCapital)),
        field('Current capital', String(portfolio.final.currentCapital)),
        field('Equity', String(portfolio.final.equity)),
        field('Cash', String(portfolio.final.cash)),
        field('Snapshot count', String(snapshots.count)),
        field('First snapshot', optionalText(snapshots.firstTimestamp)),
        field('Last snapshot', optionalText(snapshots.lastTimestamp)),
        field('Starting equity', metric(snapshots.startingEquity)),
        field('Ending equity', metric(snapshots.endingEquity)),
        field('Peak equity', metric(snapshots.peakEquity)),
        field('Trough equity', metric(snapshots.troughEquity)),
      ],
    },
    {
      id: 'trades',
      heading: 'Trades',
      fields: [
        field('Total trades', String(trading.summary.totalTrades)),
        field('Open trades', String(trading.summary.openTrades)),
        field('Closed trades', String(trading.summary.closedTrades)),
      ],
    },
    {
      id: 'performance',
      heading: 'Performance',
      fields: [
        field('Net profit', String(performance.netProfit)),
        field('Total return (%)', String(performance.totalReturnPct)),
        field('CAGR', metric(performance.cagr)),
        field('Max drawdown', String(performance.maxDrawdown)),
        field('Max drawdown (%)', String(performance.maxDrawdownPct)),
        field('Volatility', String(performance.volatility)),
        field('Sharpe ratio', metric(performance.sharpeRatio)),
        field('Sortino ratio', metric(performance.sortinoRatio)),
        field('Calmar ratio', metric(performance.calmarRatio)),
        field('Total trades', String(performance.totalTrades)),
        field('Winning trades', String(performance.winningTrades)),
        field('Losing trades', String(performance.losingTrades)),
        field('Win rate', String(performance.winRate)),
        field('Average win', String(performance.averageWin)),
        field('Average loss', String(performance.averageLoss)),
        field('Profit factor', String(performance.profitFactor)),
        field('Average trade duration (ms)', String(performance.averageTradeDurationMs)),
      ],
    },
    {
      id: 'report',
      heading: 'Report',
      fields: [
        field('Comparison score', metric(report.comparisonScore)),
        field('Generated at', report.generatedAt),
      ],
    },
  ];
}

function field(label: string, value: string): SummaryField {
  return { label, value };
}

function metric(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? UNAVAILABLE
    : String(value);
}

function optionalText(value: string | null | undefined): string {
  return value === null || value === undefined ? UNAVAILABLE : value;
}

function renderSection(section: SummarySection): string {
  const headingId = `${section.id}-heading`;
  const fields = section.fields.map(renderField).join('\n');
  return [
    `<section aria-labelledby="${escapeHtml(headingId)}">`,
    `<h2 id="${escapeHtml(headingId)}">${escapeHtml(section.heading)}</h2>`,
    '<dl>',
    fields,
    '</dl>',
    '</section>',
  ].join('\n');
}

function renderField(fieldValue: SummaryField): string {
  const label = escapeHtml(fieldValue.label);
  const value = escapeHtml(fieldValue.value);
  return `<dt>${label}</dt>\n<dd data-value="${value}">${value}</dd>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
