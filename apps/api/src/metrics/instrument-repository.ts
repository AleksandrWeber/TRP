import type { Metrics } from './metrics';
import { MetricNames } from './metrics';

/**
 * Wraps a repository so each method records repository_operations_total + repository_duration_ms (US112).
 * Does not change method semantics.
 */
export function instrumentRepository<T extends object>(
  repository: T,
  metrics: Metrics,
  repositoryName: string,
): T {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function' || typeof property !== 'string') {
        return value;
      }
      if (property === 'hydrate' || property.startsWith('_')) {
        return value.bind(target);
      }

      return (...args: unknown[]) => {
        const started = Date.now();
        const labels = { repository: repositoryName, operation: property };
        try {
          const result = value.apply(target, args);
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            return Promise.resolve(result).then(
              (resolved) => {
                record(metrics, labels, started);
                return resolved;
              },
              (error) => {
                record(metrics, labels, started);
                throw error;
              },
            );
          }
          record(metrics, labels, started);
          return result;
        } catch (error) {
          record(metrics, labels, started);
          throw error;
        }
      };
    },
  });
}

function record(
  metrics: Metrics,
  labels: { repository: string; operation: string },
  started: number,
): void {
  metrics.increment(MetricNames.repositoryOperationsTotal, 1, labels);
  metrics.timing(MetricNames.repositoryDurationMs, Date.now() - started, labels);
}
