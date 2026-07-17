/**
 * Optional structured log context (US111).
 */
export type LogContext = {
  workspaceId?: string;
  campaignId?: string;
  jobId?: string;
  userId?: string;
  durationMs?: number;
  [key: string]: unknown;
};

/**
 * Structured log entry emitted by Logger implementations (US111).
 */
export type LogEntry = {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
};

/**
 * Application Logger port (US111).
 * Services depend on this interface only — never on ConsoleLogger / Nest Logger.
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: unknown): void;
  /** Bind a component name for subsequent log entries. */
  child(component: string): Logger;
}
