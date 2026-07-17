import { describe, expect, it } from 'vitest';
import { instrumentRepository } from './instrument-repository';
import { MetricNames } from './metrics';
import { resolveMetricsDriver } from './metrics-driver';
import { NoOpMetrics } from './noop.metrics';
import { PrometheusMetrics } from './prometheus.metrics';

describe('Metrics (US112)', () => {
  it('NoOpMetrics is safe to call', () => {
    const metrics = new NoOpMetrics();
    metrics.increment('x');
    metrics.gauge('y', 1);
    metrics.histogram('z', 2);
    metrics.timing('t', 3);
  });

  it('PrometheusMetrics records counters, gauges, histograms, and timings', async () => {
    const metrics = new PrometheusMetrics();
    metrics.increment(MetricNames.httpRequestsTotal, 1, {
      method: 'GET',
      path: '/health',
      status: '200',
    });
    metrics.gauge(MetricNames.queueDepth, 4);
    metrics.timing(MetricNames.pipelineDurationMs, 12.5, { success: 'true' });

    const text = await metrics.render();
    expect(text).toContain(MetricNames.httpRequestsTotal);
    expect(text).toContain(MetricNames.queueDepth);
    expect(text).toContain(MetricNames.pipelineDurationMs);
  });

  it('instrumentRepository records operation metrics without changing results', () => {
    const metrics = new PrometheusMetrics();
    const repo = instrumentRepository(
      {
        findById(id: string) {
          return { id };
        },
      },
      metrics,
      'insight',
    );

    expect(repo.findById('a')).toEqual({ id: 'a' });
  });

  it('resolveMetricsDriver defaults to noop under vitest', () => {
    expect(resolveMetricsDriver(() => undefined)).toBe('noop');
    expect(
      resolveMetricsDriver((key) => (key === 'METRICS_DRIVER' ? 'prometheus' : undefined)),
    ).toBe('prometheus');
  });
});
