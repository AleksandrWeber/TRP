import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import type { MetricLabels, Metrics } from './metrics';
import { MetricNames } from './metrics';

type LabelMap = Record<string, string>;

/**
 * Prometheus-backed Metrics (US112).
 * Uses an isolated Registry so tests/multiple instances do not clash.
 */
export class PrometheusMetrics implements Metrics {
  readonly registry: Registry;
  private readonly counters = new Map<string, Counter<string>>();
  private readonly gauges = new Map<string, Gauge<string>>();
  private readonly histograms = new Map<string, Histogram<string>>();

  constructor(options?: { collectDefaults?: boolean; registry?: Registry }) {
    this.registry = options?.registry ?? new Registry();
    if (options?.collectDefaults) {
      collectDefaultMetrics({ register: this.registry });
    }
    this.ensureBuiltinMetrics();
  }

  increment(name: string, value = 1, labels?: MetricLabels): void {
    const counter = this.getOrCreateCounter(name, labels);
    const normalized = normalizeLabels(labels);
    if (Object.keys(normalized).length > 0) {
      counter.inc(normalized, value);
    } else {
      counter.inc(value);
    }
  }

  gauge(name: string, value: number, labels?: MetricLabels): void {
    const gauge = this.getOrCreateGauge(name, labels);
    const normalized = normalizeLabels(labels);
    if (Object.keys(normalized).length > 0) {
      gauge.set(normalized, value);
    } else {
      gauge.set(value);
    }
  }

  histogram(name: string, value: number, labels?: MetricLabels): void {
    const histogram = this.getOrCreateHistogram(name, labels);
    const normalized = normalizeLabels(labels);
    if (Object.keys(normalized).length > 0) {
      histogram.observe(normalized, value);
    } else {
      histogram.observe(value);
    }
  }

  timing(name: string, durationMs: number, labels?: MetricLabels): void {
    this.histogram(name, durationMs, labels);
  }

  async render(): Promise<string> {
    return this.registry.metrics();
  }

  private ensureBuiltinMetrics(): void {
    this.getOrCreateCounter(MetricNames.httpRequestsTotal, { method: '', path: '', status: '' });
    this.getOrCreateCounter(MetricNames.jobsProcessedTotal, { type: '', status: '' });
    this.getOrCreateCounter(MetricNames.jobsFailedTotal, { type: '' });
    this.getOrCreateCounter(MetricNames.aiRequestsTotal, { provider: '', success: '' });
    this.getOrCreateCounter(MetricNames.repositoryOperationsTotal, {
      repository: '',
      operation: '',
    });

    this.getOrCreateHistogram(MetricNames.httpRequestDurationMs, {
      method: '',
      path: '',
      status: '',
    });
    this.getOrCreateHistogram(MetricNames.aiRequestDurationMs, { provider: '', success: '' });
    this.getOrCreateHistogram(MetricNames.pipelineDurationMs, { success: '' });
    this.getOrCreateHistogram(MetricNames.repositoryDurationMs, {
      repository: '',
      operation: '',
    });

    this.getOrCreateGauge(MetricNames.queueDepth);
    this.getOrCreateGauge(MetricNames.activeJobs);
  }

  private getOrCreateCounter(name: string, labels?: MetricLabels): Counter<string> {
    const existing = this.counters.get(name);
    if (existing) return existing;

    const labelNames = Object.keys(normalizeLabels(labels));
    const counter = new Counter({
      name,
      help: `Counter ${name}`,
      labelNames,
      registers: [this.registry],
    });
    this.counters.set(name, counter);
    return counter;
  }

  private getOrCreateGauge(name: string, labels?: MetricLabels): Gauge<string> {
    const existing = this.gauges.get(name);
    if (existing) return existing;

    const labelNames = Object.keys(normalizeLabels(labels));
    const gauge = new Gauge({
      name,
      help: `Gauge ${name}`,
      labelNames,
      registers: [this.registry],
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  private getOrCreateHistogram(name: string, labels?: MetricLabels): Histogram<string> {
    const existing = this.histograms.get(name);
    if (existing) return existing;

    const labelNames = Object.keys(normalizeLabels(labels));
    const histogram = new Histogram({
      name,
      help: `Histogram ${name}`,
      labelNames,
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry],
    });
    this.histograms.set(name, histogram);
    return histogram;
  }
}

function normalizeLabels(labels?: MetricLabels): LabelMap {
  if (!labels) return {};
  const out: LabelMap = {};
  for (const [key, value] of Object.entries(labels)) {
    if (value === undefined) continue;
    out[key] = String(value);
  }
  return out;
}
