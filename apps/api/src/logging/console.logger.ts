import type { LogContext, LogEntry, Logger } from './logger';

/**
 * Console-backed structured Logger (US111).
 * Emits one JSON object per line via console methods (allowed only here).
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly component = 'App') {}

  child(component: string): Logger {
    return new ConsoleLogger(component);
  }

  debug(message: string, context?: LogContext): void {
    console.debug(JSON.stringify(this.build('debug', message, context)));
  }

  info(message: string, context?: LogContext): void {
    console.info(JSON.stringify(this.build('info', message, context)));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(JSON.stringify(this.build('warn', message, context)));
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    console.error(JSON.stringify(this.build('error', message, context, error)));
  }

  private build(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: unknown,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = { ...context };
    }

    if (error !== undefined) {
      entry.error = serializeError(error);
    }

    return entry;
  }
}

function serializeError(error: unknown): LogEntry['error'] {
  if (error instanceof Error) {
    const serialized: NonNullable<LogEntry['error']> = {
      name: error.name,
      message: error.message,
    };
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      serialized.stack = error.stack;
    }
    return serialized;
  }

  return {
    name: 'Error',
    message: String(error),
  };
}
