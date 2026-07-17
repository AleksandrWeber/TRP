import type { MetricLabels, Metrics } from './metrics';

/**
 * No-op Metrics for tests / default (US112).
 */
export class NoOpMetrics implements Metrics {
  increment(_name: string, _value?: number, _labels?: MetricLabels): void {}

  gauge(_name: string, _value: number, _labels?: MetricLabels): void {}

  histogram(_name: string, _value: number, _labels?: MetricLabels): void {}

  timing(_name: string, _durationMs: number, _labels?: MetricLabels): void {}
}
