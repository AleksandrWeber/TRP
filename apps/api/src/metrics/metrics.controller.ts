import { Controller, Get, Header, Inject } from '@nestjs/common';
import { Public } from '../modules/auth/decorators/public.decorator';
import type { Metrics } from './metrics';
import { METRICS } from './metrics.token';
import { PrometheusMetrics } from './prometheus.metrics';

/**
 * Prometheus scrape endpoint (US112).
 * Additive ops surface — does not change existing REST contracts.
 */
@Controller({ path: 'metrics', version: '1' })
export class MetricsController {
  constructor(@Inject(METRICS) private readonly metrics: Metrics) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async scrape(): Promise<string> {
    if (this.metrics instanceof PrometheusMetrics) {
      return this.metrics.render();
    }
    return '# metrics driver is noop\n';
  }
}
