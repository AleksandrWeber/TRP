import { aggregateExecutionMetrics, deterministicReportId } from './calculate-performance-metrics';
import {
  createPerformanceAnalysisRequest,
  type PerformanceAnalysisRequest,
  type CreatePerformanceAnalysisRequestInput,
} from './performance-analysis-request';
import {
  createPerformanceAnalyticsConfiguration,
  type PerformanceAnalyticsConfiguration,
} from './performance-analytics-configuration';
import type { PerformanceAnalyticsEvent } from './performance-analytics-events';
import {
  PerformanceAnalyticsDuplicateAnalysisError,
  PerformanceAnalyticsValidationError,
} from './performance-analytics-errors';
import {
  createPerformanceAnalyticsMetrics,
  type PerformanceAnalyticsMetrics,
} from './performance-analytics-metrics';
import { createPerformanceReport, type PerformanceReport } from './performance-report';

export type PerformanceAnalyticsClock = Readonly<{
  now: () => number;
  iso: () => string;
}>;

export type PerformanceAnalyticsServiceDependencies = Readonly<{
  clock?: PerformanceAnalyticsClock;
  rejectDuplicateAnalysisIds?: boolean;
}>;

/**
 * US202 Performance Analytics application service.
 *
 * Aggregates completed execution simulator results into immutable performance
 * reports. No portfolio, position, or persistence concerns.
 */
export class PerformanceAnalyticsService {
  private readonly clock: PerformanceAnalyticsClock;
  private readonly rejectDuplicateAnalysisIds: boolean;
  private readonly collectedEvents: PerformanceAnalyticsEvent[] = [];
  private readonly completedReports = new Map<string, PerformanceReport>();
  private reportsGenerated = 0;
  private executionResultsProcessed = 0;
  private totalAnalysisDuration = 0;

  private constructor(dependencies: PerformanceAnalyticsServiceDependencies = {}) {
    this.clock = dependencies.clock ?? defaultClock();
    this.rejectDuplicateAnalysisIds = dependencies.rejectDuplicateAnalysisIds === true;
  }

  static create(
    dependencies: PerformanceAnalyticsServiceDependencies = {},
  ): PerformanceAnalyticsService {
    return new PerformanceAnalyticsService(dependencies);
  }

  /**
   * Analyzes execution results and produces an immutable performance report.
   * Replays the cached report when the same analysisId is submitted again.
   */
  analyze(input: CreatePerformanceAnalysisRequestInput): PerformanceReport {
    const request = this.createRequest(input);
    const cached = this.completedReports.get(request.analysisId);
    if (cached !== undefined) {
      if (this.rejectDuplicateAnalysisIds) {
        throw new PerformanceAnalyticsDuplicateAnalysisError(request.analysisId);
      }
      return cached;
    }

    const startedAtMs = this.clock.now();
    const startedAt = this.clock.iso();

    this.recordEvent({
      eventType: 'PerformanceAnalysisStarted',
      analysisId: request.analysisId,
      occurredAt: startedAt,
      executionCount: request.executionResults.length,
    });

    let aggregated;
    try {
      aggregated = aggregateExecutionMetrics(request.executionResults, request.configuration);
    } catch (error) {
      throw new PerformanceAnalyticsValidationError(
        error instanceof Error ? error.message : 'Invalid execution results',
        error,
      );
    }

    const metricsCalculatedAt = this.clock.iso();
    this.recordEvent({
      eventType: 'PerformanceMetricsCalculated',
      analysisId: request.analysisId,
      occurredAt: metricsCalculatedAt,
      totalExecutions: aggregated.totalExecutions,
      filledExecutions: aggregated.filledExecutions,
      partialFilledExecutions: aggregated.partialFilledExecutions,
      rejectedExecutions: aggregated.rejectedExecutions,
      totalCommission: aggregated.totalCommission,
      averageSlippage: aggregated.averageSlippage,
      executionSuccessRate: aggregated.executionSuccessRate,
    });

    const generatedAt = this.clock.iso();
    const report = createPerformanceReport({
      reportId: deterministicReportId(request.analysisId),
      generatedAt,
      totalExecutions: aggregated.totalExecutions,
      filledExecutions: aggregated.filledExecutions,
      partialFilledExecutions: aggregated.partialFilledExecutions,
      rejectedExecutions: aggregated.rejectedExecutions,
      totalCommission: aggregated.totalCommission,
      averageCommission: aggregated.averageCommission,
      averageExecutionPrice: aggregated.averageExecutionPrice,
      averageSlippage: aggregated.averageSlippage,
      executionSuccessRate: aggregated.executionSuccessRate,
      averageExecutionDuration: aggregated.averageExecutionDuration,
      diagnostics: aggregated.diagnostics,
    });

    this.recordEvent({
      eventType: 'PerformanceAnalysisCompleted',
      analysisId: request.analysisId,
      occurredAt: generatedAt,
      reportId: report.reportId,
      totalExecutions: report.totalExecutions,
      executionSuccessRate: report.executionSuccessRate,
    });

    const analysisDuration = Math.max(0, this.clock.now() - startedAtMs);
    this.completedReports.set(request.analysisId, report);
    this.reportsGenerated += 1;
    this.executionResultsProcessed += request.executionResults.length;
    this.totalAnalysisDuration += analysisDuration;

    return report;
  }

  createRequest(input: CreatePerformanceAnalysisRequestInput): PerformanceAnalysisRequest {
    try {
      return createPerformanceAnalysisRequest(input);
    } catch (error) {
      throw new PerformanceAnalyticsValidationError(
        error instanceof Error ? error.message : 'Invalid analysis request',
        error,
      );
    }
  }

  createConfiguration(
    input: Parameters<typeof createPerformanceAnalyticsConfiguration>[0] = {},
  ): PerformanceAnalyticsConfiguration {
    try {
      return createPerformanceAnalyticsConfiguration(input);
    } catch (error) {
      throw new PerformanceAnalyticsValidationError(
        error instanceof Error ? error.message : 'Invalid configuration',
        error,
      );
    }
  }

  applicationEvents(): readonly PerformanceAnalyticsEvent[] {
    return Object.freeze([...this.collectedEvents]);
  }

  metrics(): PerformanceAnalyticsMetrics {
    return createPerformanceAnalyticsMetrics({
      analysisDuration: this.totalAnalysisDuration,
      reportsGenerated: this.reportsGenerated,
      executionResultsProcessed: this.executionResultsProcessed,
    });
  }

  lastReport(analysisId: string): PerformanceReport | null {
    return this.completedReports.get(analysisId.trim()) ?? null;
  }

  private recordEvent(event: PerformanceAnalyticsEvent): void {
    this.collectedEvents.push(Object.freeze({ ...event }));
  }
}

export function stablePerformanceReport(
  report: PerformanceReport,
): Omit<PerformanceReport, 'generatedAt'> & Readonly<{ generatedAt?: never }> {
  const { generatedAt: _generatedAt, ...stable } = report;
  return stable;
}

function defaultClock(): PerformanceAnalyticsClock {
  return Object.freeze({
    now: () => Date.now(),
    iso: () => new Date().toISOString(),
  });
}
