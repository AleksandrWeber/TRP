import { describe, expect, it } from 'vitest';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { BacktestResult } from '../backtesting/backtest-result';
import { toInstrument } from '../market-data/instrument';
import { Timeframe } from '../market-data/timeframe';
import type { PerformanceReport } from '../performance/performance-report';
import { toPortfolioId } from '../portfolio/portfolio-id';
import { PortfolioStatus } from '../portfolio/portfolio-status';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';
import { HtmlSimulationReportExporter } from './html-simulation-report.exporter';
import type { SimulationReport } from './simulation-report';

const ALLOWED_TAGS = new Set([
  'html',
  'head',
  'meta',
  'title',
  'style',
  'body',
  'main',
  'h1',
  'p',
  'section',
  'h2',
  'dl',
  'dt',
  'dd',
]);

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

function field(html: string, label: string): string {
  const match = new RegExp(`<dt>${label}</dt>\\n<dd data-value="([^"]*)">([^<]*)</dd>`).exec(html);
  expect(match, label).not.toBeNull();
  expect(match?.[1]).toBe(match?.[2]);
  return match?.[1] ?? '';
}

function rawTags(html: string): string[] {
  const tags: string[] = [];
  for (let index = 0; index < html.length; index += 1) {
    if (html[index] !== '<') {
      continue;
    }
    if (html.slice(index, index + 2) === '<!') {
      const close = html.indexOf('>', index);
      const declaration = html.slice(index, close + 1);
      if (declaration !== '<!DOCTYPE html>') {
        tags.push(declaration);
      }
      index = close;
      continue;
    }
    let cursor = index + 1;
    let quote: '"' | "'" | null = null;
    while (cursor < html.length) {
      const char = html[cursor];
      if (quote) {
        if (char === quote) {
          quote = null;
        }
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        tags.push(html.slice(index, cursor + 1));
        index = cursor;
        break;
      }
      cursor += 1;
    }
  }
  return tags;
}

function attributeNames(tag: string): string[] {
  const names: string[] = [];
  let index = 1;
  while (index < tag.length && tag[index] !== ' ' && tag[index] !== '>') {
    index += 1;
  }
  while (index < tag.length) {
    while (index < tag.length && /\s/.test(tag[index] ?? '')) {
      index += 1;
    }
    if (index >= tag.length || tag[index] === '>' || tag[index] === '/') {
      break;
    }
    const start = index;
    while (index < tag.length && /[A-Za-z0-9_.:-]/.test(tag[index] ?? '')) {
      index += 1;
    }
    const name = tag.slice(start, index).toLowerCase();
    while (index < tag.length && /\s/.test(tag[index] ?? '')) {
      index += 1;
    }
    if (tag[index] === '=') {
      index += 1;
      while (index < tag.length && /\s/.test(tag[index] ?? '')) {
        index += 1;
      }
      const quote = tag[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        while (index < tag.length && tag[index] !== quote) {
          index += 1;
        }
        if (tag[index] === quote) {
          index += 1;
        }
      } else {
        while (index < tag.length && !/[\s>]/.test(tag[index] ?? '')) {
          index += 1;
        }
      }
    }
    if (name.length > 0) {
      names.push(name);
    }
  }
  return names;
}

describe('HtmlSimulationReportExporter', () => {
  const exporter = new HtmlSimulationReportExporter();

  it('exports a readable summary of a populated report', () => {
    const html = exporter.export(report());

    expect(html.startsWith('<!DOCTYPE html>\n<html lang="en">')).toBe(true);
    expect(html).toContain('<h1>Simulation report summary</h1>');
    expect(html).toContain('<h2 id="session-heading">Session</h2>');
    expect(html).toContain('<h2 id="backtest-heading">Backtest</h2>');
    expect(html).toContain('<h2 id="portfolio-heading">Portfolio</h2>');
    expect(html).toContain('<h2 id="trades-heading">Trades</h2>');
    expect(html).toContain('<h2 id="performance-heading">Performance</h2>');
    expect(html).toContain('aria-labelledby="session-heading"');
    expect(field(html, 'Strategy ID')).toBe('donchian-breakout');
    expect(field(html, 'Workspace ID')).toBe('ws-1');
    expect(field(html, 'Instrument')).toBe('BTCUSDT');
    expect(field(html, 'Timeframe')).toBe(Timeframe.H1);
    expect(field(html, 'Status')).toBe(BacktestStatus.Completed);
    expect(field(html, 'Processed bars')).toBe('3');
    expect(field(html, 'Walk-forward')).toBe('Yes');
    expect(field(html, 'Portfolio ID')).toBe('pf-1');
    expect(field(html, 'Initial capital')).toBe('10000');
    expect(field(html, 'Equity')).toBe('10120.5');
    expect(field(html, 'Snapshot count')).toBe('3');
    expect(field(html, 'Peak equity')).toBe('10150');
    expect(field(html, 'Trough equity')).toBe('9960');
    expect(field(html, 'Closed trades')).toBe('2');
    expect(field(html, 'Net profit')).toBe('120.5');
    expect(field(html, 'Sharpe ratio')).toBe('1.1');
    expect(field(html, 'Sortino ratio')).toBe('1.4');
    expect(field(html, 'Calmar ratio')).toBe('0.8');
    expect(field(html, 'Comparison score')).toBe('0.91');
    expect(field(html, 'Generated at')).toBe('2026-07-17T12:00:01.000Z');
    expect(html).not.toContain('windowResults');
    expect(html).not.toContain('processedBars');
  });

  it('renders null ratios, missing snapshots, and a missing comparison score as Unavailable', () => {
    const html = exporter.export(
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
    );

    expect(field(html, 'Walk-forward')).toBe('No');
    expect(field(html, 'CAGR')).toBe('Unavailable');
    expect(field(html, 'Sharpe ratio')).toBe('Unavailable');
    expect(field(html, 'Sortino ratio')).toBe('Unavailable');
    expect(field(html, 'Calmar ratio')).toBe('Unavailable');
    expect(field(html, 'Comparison score')).toBe('Unavailable');
    expect(field(html, 'First snapshot')).toBe('Unavailable');
    expect(field(html, 'Starting equity')).toBe('Unavailable');
    expect(field(html, 'Peak equity')).toBe('Unavailable');
    expect(html).not.toContain('>null<');
    expect(html).not.toContain('>NaN<');
    expect(field(html, 'Net profit')).toBe('120.5');
  });

  it('keeps a finite zero ratio and a zero comparison score', () => {
    const html = exporter.export(
      report({
        performance: performance({ sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0 }),
        comparisonScore: 0,
      }),
    );

    expect(field(html, 'Sharpe ratio')).toBe('0');
    expect(field(html, 'Sortino ratio')).toBe('0');
    expect(field(html, 'Calmar ratio')).toBe('0');
    expect(field(html, 'Comparison score')).toBe('0');
  });

  it('renders injected markup as text and escapes attribute values', () => {
    const source = report({
      session: {
        strategyId: '<script>alert("xss")</script>',
        workspaceId: '<img src=x onerror=alert(1)>',
        instrument: toInstrument('ETH&USDT'),
        timeframe: Timeframe.D1,
        from: '2026-01-01"><iframe src=javascript:alert(1)>',
        to: "Tom & Jerry's desk",
      },
      generatedAt: `'><svg onload=alert(1)>`,
    });
    const before = JSON.stringify(source);
    const html = exporter.export(source);

    expect(field(html, 'Strategy ID')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(field(html, 'Workspace ID')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(field(html, 'Instrument')).toBe('ETH&amp;USDT');
    expect(field(html, 'From')).toBe('2026-01-01&quot;&gt;&lt;iframe src=javascript:alert(1)&gt;');
    expect(field(html, 'To')).toBe('Tom &amp; Jerry&#39;s desk');
    expect(field(html, 'Generated at')).toBe('&#39;&gt;&lt;svg onload=alert(1)&gt;');
    expect(html).toContain(
      '<dd data-value="&#39;&gt;&lt;svg onload=alert(1)&gt;">&#39;&gt;&lt;svg onload=alert(1)&gt;</dd>',
    );
    expect(html).toContain(
      '<dd data-value="2026-01-01&quot;&gt;&lt;iframe src=javascript:alert(1)&gt;">2026-01-01&quot;&gt;&lt;iframe src=javascript:alert(1)&gt;</dd>',
    );

    const tags = rawTags(html);
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      const name = /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(tag)?.[1]?.toLowerCase() ?? '';
      expect(ALLOWED_TAGS.has(name), tag).toBe(true);
      const attributes = attributeNames(tag);
      expect(attributes, tag).not.toContain('href');
      expect(attributes, tag).not.toContain('src');
      for (const attribute of attributes) {
        expect(attribute.startsWith('on'), `${tag} -> ${attribute}`).toBe(false);
      }
    }
    expect(tags.some((tag) => /^<script/i.test(tag))).toBe(false);
    expect(tags.some((tag) => /^<img/i.test(tag))).toBe(false);
    expect(tags.some((tag) => /^<svg/i.test(tag))).toBe(false);
    expect(tags.some((tag) => /^<iframe/i.test(tag))).toBe(false);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<svg/i);
    expect(html).not.toMatch(/<iframe/i);
    expect(JSON.stringify(source)).toBe(before);
  });

  it('returns the same document for equivalent reports', () => {
    const first = exporter.export(report());
    const second = exporter.export(report());

    expect(first).toBe(second);
    expect(exporter.export(report({ comparisonScore: undefined }))).toBe(
      exporter.export(report({ comparisonScore: undefined })),
    );
  });
});
