import { Injectable } from '@nestjs/common';
import {
  MarketDataDomainService,
  type SaveMarketBarInput,
} from '../market-data/market-data-domain.service';
import type { HistoricalDataImporter, HistoricalImportInput } from './historical-data-importer';
import type { ImportResult, ImportValidationError } from './import-result';

const EXPECTED_HEADER = ['timestamp', 'open', 'high', 'low', 'close', 'volume'] as const;

type ParsedRow = {
  row: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * CSV historical data importer (US116).
 * Format: timestamp,open,high,low,close,volume
 * Persists valid bars via MarketDataDomainService.saveBars().
 */
@Injectable()
export class CsvImporter implements HistoricalDataImporter {
  constructor(private readonly marketData: MarketDataDomainService) {}

  import(input: HistoricalImportInput): ImportResult {
    assertNonEmpty(input.workspaceId, 'workspaceId');
    assertNonEmpty(String(input.instrument), 'instrument');
    assertNonEmpty(input.file, 'file');

    const lines = splitCsvLines(input.file);
    if (lines.length === 0) {
      throw new Error('CSV file must include a header row');
    }

    const headerCells = parseCsvLine(lines[0]!);
    assertHeader(headerCells);

    const validationErrors: ImportValidationError[] = [];
    const accepted: SaveMarketBarInput[] = [];
    const seenTimestamps = new Set<string>();
    let lastAcceptedTimestamp: string | null = null;
    let skippedBars = 0;
    let duplicateBars = 0;

    for (let i = 1; i < lines.length; i += 1) {
      const rowNumber = i; // 1-based data row index matching line after header
      const line = lines[i]!;
      if (line.trim() === '') continue;

      const cells = parseCsvLine(line);
      if (cells.length !== EXPECTED_HEADER.length) {
        skippedBars += 1;
        validationErrors.push({
          row: rowNumber,
          message: `Expected ${EXPECTED_HEADER.length} columns, got ${cells.length}`,
        });
        continue;
      }

      const parsed = parseRow(cells, rowNumber);
      if (!parsed.ok) {
        skippedBars += 1;
        validationErrors.push(parsed.error);
        continue;
      }

      const { timestamp, open, high, low, close, volume } = parsed.value;
      const ohlcError = validateOhlc(parsed.value);
      if (ohlcError) {
        skippedBars += 1;
        validationErrors.push(ohlcError);
        continue;
      }

      if (seenTimestamps.has(timestamp)) {
        skippedBars += 1;
        duplicateBars += 1;
        continue;
      }

      if (lastAcceptedTimestamp !== null && timestamp < lastAcceptedTimestamp) {
        skippedBars += 1;
        validationErrors.push({
          row: rowNumber,
          field: 'timestamp',
          value: timestamp,
          message: `timestamp must be ascending (previous accepted: ${lastAcceptedTimestamp})`,
        });
        continue;
      }

      seenTimestamps.add(timestamp);
      lastAcceptedTimestamp = timestamp;
      accepted.push({
        workspaceId: input.workspaceId.trim(),
        instrument: String(input.instrument).trim(),
        timeframe: input.timeframe,
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    const saved = this.marketData.saveBars(accepted);

    return {
      importedBars: saved.length,
      skippedBars,
      duplicateBars,
      validationErrors,
    };
  }
}

function assertHeader(cells: string[]): void {
  const normalized = cells.map((cell) => cell.trim().toLowerCase());
  const expected = [...EXPECTED_HEADER];
  if (
    normalized.length !== expected.length ||
    expected.some((name, index) => normalized[index] !== name)
  ) {
    throw new Error(
      `CSV header must be: ${expected.join(',')}` +
        ` (got: ${cells.map((c) => c.trim()).join(',') || '<empty>'})`,
    );
  }
}

function parseRow(
  cells: string[],
  row: number,
): { ok: true; value: ParsedRow } | { ok: false; error: ImportValidationError } {
  const timestamp = cells[0]!.trim();
  if (timestamp === '' || Number.isNaN(Date.parse(timestamp))) {
    return {
      ok: false,
      error: {
        row,
        field: 'timestamp',
        value: cells[0],
        message: 'timestamp must be a valid ISO-8601 datetime',
      },
    };
  }

  const numericFields = ['open', 'high', 'low', 'close', 'volume'] as const;
  const numbers: number[] = [];
  for (let i = 0; i < numericFields.length; i += 1) {
    const field = numericFields[i]!;
    const raw = cells[i + 1]!.trim();
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value)) {
      return {
        ok: false,
        error: {
          row,
          field,
          value: cells[i + 1],
          message: `${field} must be a finite number`,
        },
      };
    }
    numbers.push(value);
  }

  const [open, high, low, close, volume] = numbers as [number, number, number, number, number];

  return {
    ok: true,
    value: { row, timestamp, open, high, low, close, volume },
  };
}

function validateOhlc(row: ParsedRow): ImportValidationError | null {
  if (row.volume < 0) {
    return {
      row: row.row,
      field: 'volume',
      value: row.volume,
      message: 'volume must not be negative',
    };
  }
  if (row.high < row.low) {
    return {
      row: row.row,
      field: 'high',
      value: row.high,
      message: 'high must be greater than or equal to low',
    };
  }
  if (row.high < row.open || row.high < row.close) {
    return {
      row: row.row,
      field: 'high',
      value: row.high,
      message: 'high must be greater than or equal to open and close',
    };
  }
  if (row.low > row.open || row.low > row.close) {
    return {
      row: row.row,
      field: 'low',
      value: row.low,
      message: 'low must be less than or equal to open and close',
    };
  }
  return null;
}

function splitCsvLines(content: string): string[] {
  return content.replace(/^\uFEFF/, '').split(/\r?\n/);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
