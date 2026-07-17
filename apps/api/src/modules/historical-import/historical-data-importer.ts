import type { Instrument } from '../market-data/instrument';
import type { Timeframe } from '../market-data/timeframe';
import type { ImportResult } from './import-result';

/**
 * Input for historical OHLCV import (US116).
 * `file` is CSV content (not a filesystem path).
 */
export type HistoricalImportInput = {
  workspaceId: string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  file: string;
};

/**
 * Pluggable historical data importer (US116).
 * Implementations parse/validate source data and persist via MarketDataDomainService.
 */
export interface HistoricalDataImporter {
  import(input: HistoricalImportInput): ImportResult;
}
