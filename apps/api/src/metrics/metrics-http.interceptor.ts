import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Metrics } from './metrics';
import { MetricNames } from './metrics';
import { METRICS } from './metrics.token';

/**
 * Records HTTP request counters and duration histograms (US112).
 * Does not alter responses.
 */
@Injectable()
export class MetricsHttpInterceptor implements NestInterceptor {
  constructor(@Inject(METRICS) private readonly metrics: Metrics) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{ method?: string; url?: string; routerPath?: string }>();
    const started = Date.now();
    const method = (request.method ?? 'GET').toUpperCase();
    const path = request.routerPath ?? sanitizePath(request.url ?? 'unknown');

    return next.handle().pipe(
      tap({
        next: () => {
          const status = String(http.getResponse<{ statusCode?: number }>()?.statusCode ?? 200);
          this.record(method, path, status, started);
        },
        error: (error: unknown) => {
          const status = String(
            (error as { status?: number; statusCode?: number })?.status ??
              (error as { statusCode?: number })?.statusCode ??
              500,
          );
          this.record(method, path, status, started);
        },
      }),
    );
  }

  private record(method: string, path: string, status: string, started: number): void {
    const labels = { method, path, status };
    this.metrics.increment(MetricNames.httpRequestsTotal, 1, labels);
    this.metrics.timing(MetricNames.httpRequestDurationMs, Date.now() - started, labels);
  }
}

function sanitizePath(url: string): string {
  const path = url.split('?')[0] ?? url;
  return path.length > 0 ? path : 'unknown';
}
