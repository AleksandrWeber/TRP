/**
 * Optional metric labels (US112).
 */
export type MetricLabels = Record<string, string | number | boolean | undefined>;

/**
 * Application Metrics port (US112).
 * Services depend on this interface only — never on Prometheus / NoOp concretes.
 */
export interface Metrics {
  increment(name: string, value?: number, labels?: MetricLabels): void;
  gauge(name: string, value: number, labels?: MetricLabels): void;
  histogram(name: string, value: number, labels?: MetricLabels): void;
  /** Records a duration in milliseconds (implemented as histogram). */
  timing(name: string, durationMs: number, labels?: MetricLabels): void;
}

/**
 * Canonical metric names collected by the application (US112).
 */
export const MetricNames = {
  httpRequestsTotal: 'http_requests_total',
  jobsProcessedTotal: 'jobs_processed_total',
  jobsFailedTotal: 'jobs_failed_total',
  aiRequestsTotal: 'ai_requests_total',
  repositoryOperationsTotal: 'repository_operations_total',
  httpRequestDurationMs: 'http_request_duration_ms',
  aiRequestDurationMs: 'ai_request_duration_ms',
  pipelineDurationMs: 'pipeline_duration_ms',
  repositoryDurationMs: 'repository_duration_ms',
  queueDepth: 'queue_depth',
  activeJobs: 'active_jobs',
} as const;
