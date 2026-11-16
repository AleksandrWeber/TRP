import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { BacktestResult } from '../backtesting/backtest-result';
import { toInstrument } from '../market-data/instrument';
import { Timeframe } from '../market-data/timeframe';
import type { PerformanceReport } from '../performance/performance-report';
import { toPortfolioId } from '../portfolio/portfolio-id';
import { PortfolioStatus } from '../portfolio/portfolio-status';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';
import { PdfSimulationReportExporter } from './pdf-simulation-report.exporter';
import type { SimulationReport } from './simulation-report';

const WIN_ANSI_REVERSE: Readonly<Record<number, string>> = {
  128: '\u20ac',
  130: '\u201a',
  131: '\u0192',
  132: '\u201e',
  133: '\u2026',
  134: '\u2020',
  135: '\u2021',
  136: '\u02c6',
  137: '\u2030',
  138: '\u0160',
  139: '\u2039',
  140: '\u0152',
  142: '\u017d',
  145: '\u2018',
  146: '\u2019',
  147: '\u201c',
  148: '\u201d',
  149: '\u2022',
  150: '\u2013',
  151: '\u2014',
  152: '\u02dc',
  153: '\u2122',
  154: '\u0161',
  155: '\u203a',
  156: '\u0153',
  158: '\u017e',
  159: '\u0178',
};

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

function streamBodies(pdf: Buffer): string[] {
  const latin = pdf.toString('latin1');
  const bodies: string[] = [];
  let search = 0;
  while (search < latin.length) {
    const streamAt = latin.indexOf('stream', search);
    if (streamAt < 0) {
      break;
    }
    const dictStart = latin.lastIndexOf('<<', streamAt);
    const dict = dictStart < 0 ? '' : latin.slice(dictStart, streamAt);
    let dataStart = streamAt + 'stream'.length;
    if (latin[dataStart] === '\r' && latin[dataStart + 1] === '\n') {
      dataStart += 2;
    } else if (latin[dataStart] === '\n') {
      dataStart += 1;
    }
    const end = latin.indexOf('endstream', dataStart);
    if (end < 0) {
      break;
    }
    let dataEnd = end;
    if (latin[dataEnd - 1] === '\n') {
      dataEnd -= 1;
    }
    if (latin[dataEnd - 1] === '\r') {
      dataEnd -= 1;
    }
    const raw = pdf.subarray(dataStart, dataEnd);
    const decoded = dict.includes('/FlateDecode') ? inflateSync(raw) : raw;
    bodies.push(decoded.toString('latin1'));
    search = end + 'endstream'.length;
  }
  return bodies;
}

function decodeWinAnsi(hex: string): string {
  const bytes = Buffer.from(hex, 'hex');
  let text = '';
  for (const byte of bytes) {
    if (byte >= 32 && byte <= 126) {
      text += String.fromCharCode(byte);
    } else if (byte >= 160) {
      text += String.fromCharCode(byte);
    } else if (WIN_ANSI_REVERSE[byte] !== undefined) {
      text += WIN_ANSI_REVERSE[byte];
    }
  }
  return text;
}

function extractPdfText(pdf: Buffer): string {
  const lines: string[] = [];
  for (const body of streamBodies(pdf)) {
    for (const block of body.matchAll(/BT([\s\S]*?)ET/g)) {
      let line = '';
      for (const hex of block[1]?.matchAll(/<([0-9A-Fa-f]+)>/g) ?? []) {
        const value = hex[1] ?? '';
        if (value.length > 0 && value.length % 2 === 0) {
          line += decodeWinAnsi(value);
        }
      }
      if (line.length > 0) {
        lines.push(line);
      }
    }
  }
  return lines.join('\n');
}

function valuesFor(text: string, label: string): string[] {
  const lines = text.split('\n').map((line) => line.trim());
  const values: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] === label) {
      values.push(lines[index + 1] ?? '');
    }
  }
  return values;
}

describe('PdfSimulationReportExporter', () => {
  const exporter = new PdfSimulationReportExporter();

  it('returns a completed PDF whose text contains the populated summary', async () => {
    const pdf = await exporter.export(report());
    const text = extractPdfText(pdf);

    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.subarray(pdf.length - 6).toString('ascii')).toBe('%%EOF\n');
    expect(text).toContain('Simulation report summary');
    expect(text).toContain('Session');
    expect(text).toContain('Backtest');
    expect(text).toContain('Portfolio');
    expect(text).toContain('Trades');
    expect(text).toContain('Performance');
    expect(valuesFor(text, 'Strategy ID')).toEqual(['donchian-breakout']);
    expect(valuesFor(text, 'Workspace ID')).toEqual(['ws-1']);
    expect(valuesFor(text, 'Instrument')).toEqual(['BTCUSDT']);
    expect(valuesFor(text, 'Timeframe')).toEqual([Timeframe.H1]);
    expect(valuesFor(text, 'Status')).toEqual([BacktestStatus.Completed, PortfolioStatus.Closed]);
    expect(valuesFor(text, 'Processed bars')).toEqual(['3']);
    expect(valuesFor(text, 'Walk-forward')).toEqual(['Yes']);
    expect(valuesFor(text, 'Portfolio ID')).toEqual(['pf-1']);
    expect(valuesFor(text, 'Initial capital')).toEqual(['10000']);
    expect(valuesFor(text, 'Equity')).toEqual(['10120.5']);
    expect(valuesFor(text, 'Snapshot count')).toEqual(['3']);
    expect(valuesFor(text, 'Peak equity')).toEqual(['10150']);
    expect(valuesFor(text, 'Trough equity')).toEqual(['9960']);
    expect(valuesFor(text, 'Closed trades')).toEqual(['2']);
    expect(valuesFor(text, 'Net profit')).toEqual(['120.5']);
    expect(valuesFor(text, 'Sharpe ratio')).toEqual(['1.1']);
    expect(valuesFor(text, 'Sortino ratio')).toEqual(['1.4']);
    expect(valuesFor(text, 'Calmar ratio')).toEqual(['0.8']);
    expect(valuesFor(text, 'Comparison score')).toEqual(['0.91']);
    expect(valuesFor(text, 'Generated at')).toEqual(['2026-07-17T12:00:01.000Z']);
    expect(text).not.toContain('windowResults');
  });

  it('renders missing ratios, snapshots, and comparison score as Unavailable', async () => {
    const text = extractPdfText(
      await exporter.export(
        report({
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
        }),
      ),
    );

    expect(valuesFor(text, 'Walk-forward')).toEqual(['No']);
    expect(valuesFor(text, 'CAGR')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Sharpe ratio')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Sortino ratio')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Calmar ratio')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Comparison score')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'First snapshot')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Last snapshot')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Starting equity')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Peak equity')).toEqual(['Unavailable']);
    expect(valuesFor(text, 'Net profit')).toEqual(['120.5']);
    expect(text).not.toContain('null');
    expect(text).not.toContain('NaN');
  });

  it('keeps a finite zero ratio and a zero comparison score', async () => {
    const text = extractPdfText(
      await exporter.export(
        report({
          performance: performance({ sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0 }),
          comparisonScore: 0,
        }),
      ),
    );

    expect(valuesFor(text, 'Sharpe ratio')).toEqual(['0']);
    expect(valuesFor(text, 'Sortino ratio')).toEqual(['0']);
    expect(valuesFor(text, 'Calmar ratio')).toEqual(['0']);
    expect(valuesFor(text, 'Comparison score')).toEqual(['0']);
  });

  it('emits script and quote payloads as plain text without changing the report', async () => {
    const source = report({
      session: {
        strategyId: '<script>alert("xss")</script>',
        workspaceId: 'say "hi"',
        instrument: toInstrument('ETHUSDT'),
        timeframe: Timeframe.D1,
        from: '2026-01-01"><iframe src=javascript:alert(1)>',
        to: "Tom & Jerry's desk",
      },
    });
    const before = JSON.stringify(source);
    const text = extractPdfText(await exporter.export(source));

    expect(text).toContain('<script>alert("xss")</script>');
    expect(text).toContain('say "hi"');
    expect(text).toContain('2026-01-01"><iframe src=javascript:alert(1)>');
    expect(text).toContain("Tom & Jerry's desk");
    expect(text).not.toContain('&lt;');
    expect(text).not.toContain('&quot;');
    expect(JSON.stringify(source)).toBe(before);
  });

  it('draws a Latin-1 character and rejects a character Helvetica cannot draw', async () => {
    const latin = report({
      session: {
        strategyId: 'Café',
        workspaceId: 'ws-1',
        instrument: toInstrument('BTCUSDT'),
        timeframe: Timeframe.H1,
        from: '2026-07-17T10:00:00.000Z',
        to: '2026-07-17T12:00:00.000Z',
      },
    });
    expect(valuesFor(extractPdfText(await exporter.export(latin)), 'Strategy ID')).toEqual([
      'Café',
    ]);

    const unsupported = report({
      session: {
        strategyId: '策略',
        workspaceId: 'ws-1',
        instrument: toInstrument('BTCUSDT'),
        timeframe: Timeframe.H1,
        from: '2026-07-17T10:00:00.000Z',
        to: '2026-07-17T12:00:00.000Z',
      },
    });
    const before = JSON.stringify(unsupported);
    await expect(exporter.export(unsupported)).rejects.toThrow(/U\+7B56/);
    expect(JSON.stringify(unsupported)).toBe(before);
  });

  it('uses generatedAt for both document dates and rejects an invalid timestamp', async () => {
    const pdf = await exporter.export(report());
    const occurrences = pdf.toString('latin1').split('D:20260717120001Z').length - 1;

    expect(occurrences).toBeGreaterThanOrEqual(2);
    await expect(exporter.export(report({ generatedAt: 'not-a-timestamp' }))).rejects.toThrow(
      /generatedAt must be a valid timestamp/,
    );
  });

  it('extracts the same text for equivalent reports', async () => {
    const first = extractPdfText(await exporter.export(report()));
    const second = extractPdfText(await exporter.export(report()));
    const missing = extractPdfText(await exporter.export(report({ comparisonScore: undefined })));
    const missingAgain = extractPdfText(
      await exporter.export(report({ comparisonScore: undefined })),
    );

    expect(first).toBe(second);
    expect(missing).toBe(missingAgain);
    expect(missing).not.toBe(first);
  });

  it('rejects when rendering fails after the document stream is open', async () => {
    const source = report();
    let reads = 0;
    Object.defineProperty(source.session, 'strategyId', {
      configurable: true,
      get() {
        reads += 1;
        if (reads > 1) {
          throw new Error('render failed');
        }
        return 'donchian-breakout';
      },
    });

    await expect(exporter.export(source)).rejects.toThrow('render failed');
  });
});
