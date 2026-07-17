/**
 * Row-level validation failure from historical import (US116).
 */
export type ImportValidationError = {
  /** 1-based CSV data row number (header is row 0 conceptually; first data row = 1). */
  row: number;
  message: string;
  field?: string;
  value?: unknown;
};

/**
 * Outcome of a historical data import (US116).
 */
export type ImportResult = {
  importedBars: number;
  skippedBars: number;
  duplicateBars: number;
  validationErrors: ImportValidationError[];
};
