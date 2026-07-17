/**
 * Logger driver selection (US111).
 * LOGGER_DRIVER=console|noop — default: noop in test, otherwise console.
 */
export type LoggerDriver = 'console' | 'noop';

export function resolveLoggerDriver(get?: (key: string) => string | undefined): LoggerDriver {
  const raw = (get?.('LOGGER_DRIVER') ?? process.env.LOGGER_DRIVER ?? '').trim().toLowerCase();

  if (raw === 'console') return 'console';
  if (raw === 'noop') return 'noop';

  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return 'noop';
  }

  return 'console';
}
