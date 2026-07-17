import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { resolveMetricsDriver } from './metrics-driver';
import { MetricsHttpInterceptor } from './metrics-http.interceptor';
import { MetricsController } from './metrics.controller';
import { METRICS } from './metrics.token';
import { NoOpMetrics } from './noop.metrics';
import { PrometheusMetrics } from './prometheus.metrics';

/**
 * Global metrics module (US112).
 * Provides METRICS token → NoOpMetrics | PrometheusMetrics.
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: METRICS,
      useFactory: () => {
        return resolveMetricsDriver() === 'prometheus'
          ? new PrometheusMetrics()
          : new NoOpMetrics();
      },
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsHttpInterceptor,
    },
  ],
  exports: [METRICS],
})
export class MetricsModule {}
