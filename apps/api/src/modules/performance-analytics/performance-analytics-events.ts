/**
 * Application events for US202 Performance Analytics.
 *
 * Collected in-memory by PerformanceAnalyticsService. No transport layer.
 */

export const PERFORMANCE_ANALYTICS_EVENT_TYPES = Object.freeze([
  'PerformanceAnalysisStarted',
  'PerformanceMetricsCalculated',
  'PerformanceAnalysisCompleted',
] as const);

export type PerformanceAnalyticsEventType = (typeof PERFORMANCE_ANALYTICS_EVENT_TYPES)[number];

type PerformanceAnalyticsEventBase<Type extends string> = Readonly<{
  eventType: Type;
  analysisId: string;
  occurredAt: string;
}>;

export type PerformanceAnalysisStarted =
  PerformanceAnalyticsEventBase<'PerformanceAnalysisStarted'> &
    Readonly<{
      executionCount: number;
    }>;

export type PerformanceMetricsCalculated =
  PerformanceAnalyticsEventBase<'PerformanceMetricsCalculated'> &
    Readonly<{
      totalExecutions: number;
      filledExecutions: number;
      partialFilledExecutions: number;
      rejectedExecutions: number;
      totalCommission: number;
      averageSlippage: number;
      executionSuccessRate: number;
    }>;

export type PerformanceAnalysisCompleted =
  PerformanceAnalyticsEventBase<'PerformanceAnalysisCompleted'> &
    Readonly<{
      reportId: string;
      totalExecutions: number;
      executionSuccessRate: number;
    }>;

export type PerformanceAnalyticsEvent =
  PerformanceAnalysisStarted | PerformanceMetricsCalculated | PerformanceAnalysisCompleted;
