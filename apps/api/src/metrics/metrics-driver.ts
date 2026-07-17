/**
 * Metrics driver selection (US112).
 * METRICS_DRIVER=noop|prometheus — default: noop in test, otherwise prometheus.
 */
export type MetricsDriver = 'noop' | 'prometheus';

export function resolveMetricsDriver(get?: (key: string) => string | undefined): MetricsDriver {
  const raw = (get?.('METRICS_DRIVER') ?? process.env.METRICS_DRIVER ?? '').trim().toLowerCase();

  if (raw === 'prometheus') return 'prometheus';
  if (raw === 'noop') return 'noop';

  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return 'noop';
  }

  return 'prometheus';
}
