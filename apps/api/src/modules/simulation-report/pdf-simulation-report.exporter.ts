import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { SimulationReport } from './simulation-report';

const UNAVAILABLE = 'Unavailable';

/**
 * Unicode code points that PDFKit's Helvetica WinAnsi map encodes specially.
 * Matches PDFKit 0.20.2 `WIN_ANSI_MAP`.
 */
const WIN_ANSI_UNICODE_TO_BYTE: Readonly<Record<number, number>> = {
  402: 131,
  8211: 150,
  8212: 151,
  8216: 145,
  8217: 146,
  8218: 130,
  8220: 147,
  8221: 148,
  8222: 132,
  8224: 134,
  8225: 135,
  8226: 149,
  8230: 133,
  8364: 128,
  8240: 137,
  8249: 139,
  8250: 155,
  710: 136,
  8482: 153,
  338: 140,
  339: 156,
  732: 152,
  352: 138,
  353: 154,
  376: 159,
  381: 142,
  382: 158,
};

/** WinAnsi bytes whose Helvetica glyph is `.notdef`. */
const NOTDEF_BYTES = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 127, 129, 141, 143, 144, 157,
]);

/**
 * One PDF summary of a SimulationReport.
 * Nested bars, trades, and equity snapshots stay on the in-memory artifact.
 * Helvetica draws WinAnsi text. A character it cannot draw fails the export.
 */
@Injectable()
export class PdfSimulationReportExporter {
  export(report: SimulationReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let doc: PDFKit.PDFDocument;
      try {
        doc = createDocument(report);
      } catch (error) {
        reject(asError(error));
        return;
      }

      const chunks: Buffer[] = [];
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        try {
          doc.destroy();
        } catch {
          // The stream may already be closed.
        }
        reject(asError(error));
      };

      doc.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      doc.on('error', fail);
      doc.on('end', () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(Buffer.concat(chunks));
      });

      try {
        writeSummary(doc, report);
        doc.end();
      } catch (error) {
        fail(error);
      }
    });
  }
}

function createDocument(report: SimulationReport): PDFKit.PDFDocument {
  const generatedAt = parseGeneratedAt(report.generatedAt);
  assertEncodable(report);
  return new PDFDocument({
    compress: true,
    size: 'A4',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: 'Simulation report summary',
      Author: 'TRP',
      Creator: 'TRP simulation report',
      Producer: 'TRP',
      CreationDate: generatedAt,
      ModDate: generatedAt,
    },
  });
}

function writeSummary(doc: PDFKit.PDFDocument, report: SimulationReport): void {
  doc.fillColor('#111111');
  doc.font('Helvetica-Bold').fontSize(18).text('Simulation report summary');
  doc.moveDown(0.4);
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      'Summary of one simulation report. Nested bars, trades, and equity snapshots are omitted.',
    );
  doc.moveDown(0.8);

  for (const section of summarySections(report)) {
    doc.font('Helvetica-Bold').fontSize(13).text(section.heading);
    doc.moveDown(0.3);
    for (const entry of section.fields) {
      doc.font('Helvetica-Bold').fontSize(10).text(entry.label);
      doc.font('Helvetica').fontSize(10).text(entry.value);
      doc.moveDown(0.15);
    }
    doc.moveDown(0.45);
  }
}

type SummaryField = Readonly<{
  label: string;
  value: string;
}>;

type SummarySection = Readonly<{
  heading: string;
  fields: readonly SummaryField[];
}>;

function summarySections(report: SimulationReport): readonly SummarySection[] {
  const { session, execution, portfolio, trading, performance } = report;
  const snapshots = portfolio.snapshotsSummary;
  return [
    {
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
      heading: 'Trades',
      fields: [
        field('Total trades', String(trading.summary.totalTrades)),
        field('Open trades', String(trading.summary.openTrades)),
        field('Closed trades', String(trading.summary.closedTrades)),
      ],
    },
    {
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

function parseGeneratedAt(value: string): Date {
  const generatedAt = new Date(value);
  if (Number.isNaN(generatedAt.getTime())) {
    throw new Error('generatedAt must be a valid timestamp');
  }
  return generatedAt;
}

function assertEncodable(report: SimulationReport): void {
  for (const section of summarySections(report)) {
    assertWinAnsi(section.heading, 'section');
    for (const entry of section.fields) {
      assertWinAnsi(entry.label, entry.label);
      assertWinAnsi(entry.value, entry.label);
    }
  }
}

function assertWinAnsi(value: string, label: string): void {
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code === undefined || code === 0x0a || code === 0x0d) {
      continue;
    }
    if (winAnsiByte(code) === null) {
      const hex = code.toString(16).toUpperCase().padStart(4, '0');
      throw new Error(`${label} contains U+${hex}, which Helvetica cannot draw`);
    }
  }
}

function winAnsiByte(code: number): number | null {
  const mapped = WIN_ANSI_UNICODE_TO_BYTE[code] ?? (code <= 255 ? code : null);
  if (mapped === null || mapped > 255 || NOTDEF_BYTES.has(mapped)) {
    return null;
  }
  return mapped;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
