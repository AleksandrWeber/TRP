import type { LogContext, Logger } from './logger';

/**
 * No-op Logger for tests (US111).
 */
export class NoOpLogger implements Logger {
  child(_component: string): Logger {
    return this;
  }

  debug(_message: string, _context?: LogContext): void {}

  info(_message: string, _context?: LogContext): void {}

  warn(_message: string, _context?: LogContext): void {}

  error(_message: string, _context?: LogContext, _error?: unknown): void {}
}
