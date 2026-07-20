import { describe, expect, it, vi } from 'vitest';

import {
  createExecutionFill,
  createExecutionResult,
  deterministicFillId,
} from '../execution-simulator';
import * as calculatePerformanceMetricsModule from './calculate-performance-metrics';
import * as performanceAnalysisRequestModule from './performance-analysis-request';
import * as performanceAnalyticsConfigurationModule from './performance-analytics-configuration';
import {
  aggregateExecutionMetrics,
  createPerformanceAnalysisRequest,
  createPerformanceAnalyticsConfiguration,
  createPerformanceAnalyticsMetrics,
  createPerformanceDiagnostics,
  createPerformanceReport,
  deterministicReportId,
  PerformanceAnalyticsDuplicateAnalysisError,
  PerformanceAnalyticsService,
  PerformanceAnalyticsValidationError,
  PERFORMANCE_ANALYTICS_EVENT_TYPES,
  stablePerformanceReport,
  validateExecutionResult,
  type PerformanceAnalyticsClock,
  type PerformanceAnalysisRequest,
} from './index';

const REQUEST_AT = '2026-07-20T10:00:00.000Z';
const STARTED_AT = '2026-07-20T10:00:01.000Z';
const COMPLETED_AT = '2026-07-20T10:00:02.000Z';
const GENERATED_AT = '2026-07-20T10:00:03.000Z';
const ANALYSIS_ID = 'analysis-us202';

function createClock(
  isoTimes: readonly string[],
  nowValues: readonly number[] = [1_000, 1_002, 1_004, 1_006],
): PerformanceAnalyticsClock {
  let isoIndex = 0;
  let nowIndex = 0;
  return Object.freeze({
    iso: () => {
      const value = isoTimes[Math.min(isoIndex, isoTimes.length - 1)] as string;
      isoIndex += 1;
      return value;
    },
    now: () => {
      const value = nowValues[Math.min(nowIndex, nowValues.length - 1)] as number;
      nowIndex += 1;
      return value;
    },
  });
}

function createService(
  overrides: {
    clock?: PerformanceAnalyticsClock;
    rejectDuplicateAnalysisIds?: boolean;
  } = {},
): PerformanceAnalyticsService {
  return PerformanceAnalyticsService.create({
    clock:
      overrides.clock ??
      createClock([STARTED_AT, COMPLETED_AT, GENERATED_AT], [1_000, 1_001, 1_002, 1_003]),
    rejectDuplicateAnalysisIds: overrides.rejectDuplicateAnalysisIds,
  });
}

function createFilledResult(
  requestId: string,
  overrides: Partial<{
    executedPrice: number;
    executedQuantity: number;
    commission: number;
    executionDuration: number;
    executionStatus: 'FILLED' | 'PARTIALLY_FILLED' | 'REJECTED';
  }> = {},
) {
  const executionStatus = overrides.executionStatus ?? 'FILLED';
  return createExecutionResult({
    requestId,
    fill: createExecutionFill({
      fillId: deterministicFillId(requestId),
      requestId,
      executedPrice: overrides.executedPrice ?? 100.5,
      executedQuantity: overrides.executedQuantity ?? 4,
      timestamp: REQUEST_AT,
      executionStatus,
    }),
    commission: overrides.commission ?? 1.25,
    startedAt: STARTED_AT,
    completedAt: COMPLETED_AT,
    executionDuration: overrides.executionDuration ?? 5,
  });
}

function defaultConfiguration() {
  return createPerformanceAnalyticsConfiguration({
    requestedPricesByRequestId: {
      'req-filled-1': 100,
      'req-filled-2': 50,
      'req-partial': 200,
      'req-rejected': 75,
      'req-metrics-1': 100,
      'req-metrics-2': 100,
      'req-metrics-3': 100,
      'req-deterministic': 100,
      'req-idempotent': 100,
      'req-diagnostics-anomaly': 100,
      'req-diagnostics-warning': 200,
      'req-single': 100,
    },
  });
}

function defaultRequest(
  overrides: Partial<PerformanceAnalysisRequest> = {},
): PerformanceAnalysisRequest {
  return createPerformanceAnalysisRequest({
    analysisId: ANALYSIS_ID,
    executionResults: overrides.executionResults ?? [createFilledResult('req-single')],
    configuration: overrides.configuration ?? defaultConfiguration(),
  });
}

describe('US202 PerformanceAnalyticsConfiguration', () => {
  it('creates an immutable configuration', () => {
    const configuration = createPerformanceAnalyticsConfiguration({
      requestedPricesByRequestId: { 'req-1': 100 },
    });
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(configuration.requestedPricesByRequestId['req-1']).toBe(100);
  });

  it('rejects invalid requested prices', () => {
    expect(() =>
      createPerformanceAnalyticsConfiguration({
        requestedPricesByRequestId: { '': 100 },
      }),
    ).toThrow('requestedPricesByRequestId keys must be non-empty request ids');
    expect(() =>
      createPerformanceAnalyticsConfiguration({
        requestedPricesByRequestId: { 'req-1': -1 },
      }),
    ).toThrow('requested price for req-1 must be a non-negative number');
  });
});

describe('US202 PerformanceAnalysisRequest', () => {
  it('creates an immutable request', () => {
    const request = defaultRequest();
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.executionResults)).toBe(true);
  });

  it('rejects empty analysis id and null execution results', () => {
    expect(() =>
      createPerformanceAnalysisRequest({
        analysisId: '',
        executionResults: [],
      }),
    ).toThrow('analysisId is required');
    expect(() =>
      createPerformanceAnalysisRequest({
        analysisId: ANALYSIS_ID,
        executionResults: null,
      }),
    ).toThrow('executionResults are required');
  });
});

describe('US202 PerformanceDiagnostics and PerformanceReport', () => {
  it('creates immutable diagnostics and report objects', () => {
    const diagnostics = createPerformanceDiagnostics({
      warnings: ['warning'],
      anomalies: ['anomaly'],
      validationMessages: ['validated 1 execution results'],
    });
    const report = createPerformanceReport({
      reportId: deterministicReportId(ANALYSIS_ID),
      generatedAt: GENERATED_AT,
      totalExecutions: 1,
      filledExecutions: 1,
      partialFilledExecutions: 0,
      rejectedExecutions: 0,
      totalCommission: 1.25,
      averageCommission: 1.25,
      averageExecutionPrice: 100.5,
      averageSlippage: 0.5,
      executionSuccessRate: 1,
      averageExecutionDuration: 5,
      diagnostics,
    });

    expect(Object.isFrozen(diagnostics)).toBe(true);
    expect(Object.isFrozen(report)).toBe(true);
  });

  it('validates report and diagnostics factories', () => {
    expect(() =>
      createPerformanceDiagnostics({
        warnings: [''],
        anomalies: [],
        validationMessages: [],
      }),
    ).toThrow('warnings[0] must be a non-empty string');
    expect(() =>
      createPerformanceReport({
        reportId: '',
        generatedAt: GENERATED_AT,
        totalExecutions: 1,
        filledExecutions: 1,
        partialFilledExecutions: 0,
        rejectedExecutions: 0,
        totalCommission: 0,
        averageCommission: 0,
        averageExecutionPrice: 0,
        averageSlippage: 0,
        executionSuccessRate: 0,
        averageExecutionDuration: 0,
        diagnostics: createPerformanceDiagnostics({
          warnings: [],
          anomalies: [],
          validationMessages: [],
        }),
      }),
    ).toThrow('reportId is required');
    expect(() =>
      createPerformanceReport({
        reportId: 'report-1',
        generatedAt: 'bad',
        totalExecutions: 1,
        filledExecutions: 1,
        partialFilledExecutions: 0,
        rejectedExecutions: 0,
        totalCommission: 0,
        averageCommission: 0,
        averageExecutionPrice: 0,
        averageSlippage: 0,
        executionSuccessRate: 2,
        averageExecutionDuration: 0,
        diagnostics: createPerformanceDiagnostics({
          warnings: [],
          anomalies: [],
          validationMessages: [],
        }),
      }),
    ).toThrow('generatedAt must be an ISO-8601 UTC timestamp');
    expect(() =>
      createPerformanceAnalyticsMetrics({
        analysisDuration: -1,
        reportsGenerated: 0,
        executionResultsProcessed: 0,
      }),
    ).toThrow('analysisDuration must be a non-negative integer');
  });
});

describe('US202 aggregateExecutionMetrics', () => {
  it('aggregates metrics for a single filled execution', () => {
    const aggregated = aggregateExecutionMetrics(
      [createFilledResult('req-single', { executedPrice: 100.5, commission: 1.25 })],
      defaultConfiguration(),
    );

    expect(aggregated.totalExecutions).toBe(1);
    expect(aggregated.filledExecutions).toBe(1);
    expect(aggregated.partialFilledExecutions).toBe(0);
    expect(aggregated.rejectedExecutions).toBe(0);
    expect(aggregated.totalCommission).toBe(1.25);
    expect(aggregated.averageCommission).toBe(1.25);
    expect(aggregated.averageExecutionPrice).toBe(100.5);
    expect(aggregated.averageSlippage).toBe(0.5);
    expect(aggregated.executionSuccessRate).toBe(1);
    expect(aggregated.averageExecutionDuration).toBe(5);
  });

  it('aggregates metrics for multiple filled, partial, and rejected executions', () => {
    const results = [
      createFilledResult('req-filled-1', {
        executedPrice: 100.5,
        commission: 1.25,
        executionDuration: 4,
      }),
      createFilledResult('req-filled-2', {
        executedPrice: 49,
        commission: 2,
        executionDuration: 6,
      }),
      createFilledResult('req-partial', {
        executedPrice: 201,
        executedQuantity: 2,
        commission: 0.75,
        executionDuration: 8,
        executionStatus: 'PARTIALLY_FILLED',
      }),
      createFilledResult('req-rejected', {
        executedPrice: 0,
        executedQuantity: 0,
        commission: 0,
        executionDuration: 2,
        executionStatus: 'REJECTED',
      }),
    ];

    const aggregated = aggregateExecutionMetrics(results, defaultConfiguration());

    expect(aggregated.totalExecutions).toBe(4);
    expect(aggregated.filledExecutions).toBe(2);
    expect(aggregated.partialFilledExecutions).toBe(1);
    expect(aggregated.rejectedExecutions).toBe(1);
    expect(aggregated.totalCommission).toBe(4);
    expect(aggregated.averageCommission).toBe(1);
    expect(aggregated.averageExecutionPrice).toBe((100.5 + 49 + 201) / 3);
    expect(aggregated.averageSlippage).toBe((0.5 + 1 + 1) / 3);
    expect(aggregated.executionSuccessRate).toBe(0.75);
    expect(aggregated.averageExecutionDuration).toBe(5);
  });

  it('returns zero averages for an empty collection', () => {
    const aggregated = aggregateExecutionMetrics([], defaultConfiguration());
    expect(aggregated.totalExecutions).toBe(0);
    expect(aggregated.averageCommission).toBe(0);
    expect(aggregated.averageExecutionPrice).toBe(0);
    expect(aggregated.averageSlippage).toBe(0);
    expect(aggregated.executionSuccessRate).toBe(0);
    expect(aggregated.diagnostics.validationMessages).toContain(
      'validated empty execution result collection',
    );
  });

  it('rejects invalid prices and commissions', () => {
    const invalidPrice = Object.freeze({
      requestId: 'req-invalid-price',
      fill: Object.freeze({
        fillId: 'fill-invalid-price',
        requestId: 'req-invalid-price',
        executedPrice: -1,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED' as const,
      }),
      commission: 1,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
      executionDuration: 1,
    });
    const invalidCommission = Object.freeze({
      requestId: 'req-invalid-commission',
      fill: Object.freeze({
        fillId: 'fill-invalid-commission',
        requestId: 'req-invalid-commission',
        executedPrice: 1,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED' as const,
      }),
      commission: -1,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
      executionDuration: 1,
    });

    expect(() => aggregateExecutionMetrics([invalidPrice], defaultConfiguration())).toThrow(
      'invalid price for req-invalid-price',
    );
    expect(() => aggregateExecutionMetrics([invalidCommission], defaultConfiguration())).toThrow(
      'invalid commission for req-invalid-commission',
    );
    expect(() => validateExecutionResult(invalidPrice)).toThrow('invalid price');
    expect(() => validateExecutionResult(invalidCommission)).toThrow('invalid commission');
  });

  it('collects diagnostics warnings and anomalies', () => {
    const results = [
      createFilledResult('req-diagnostics-warning', {
        executedPrice: 201,
        executedQuantity: 2,
        commission: 0,
        executionStatus: 'PARTIALLY_FILLED',
      }),
      createFilledResult('req-diagnostics-anomaly', {
        executedPrice: 100.5,
        commission: 1.25,
      }),
      createFilledResult('req-missing-price', {
        executedPrice: 10,
        commission: 1,
      }),
      createFilledResult('req-rejected-anomaly', {
        executedPrice: 10,
        executedQuantity: 1,
        commission: 2,
        executionStatus: 'REJECTED',
      }),
    ];

    const aggregated = aggregateExecutionMetrics(
      results,
      createPerformanceAnalyticsConfiguration({
        requestedPricesByRequestId: {
          'req-diagnostics-warning': 200,
          'req-diagnostics-anomaly': 100,
        },
      }),
    );

    expect(aggregated.diagnostics.warnings).toContain(
      'partial fill req-diagnostics-warning has zero commission',
    );
    expect(aggregated.diagnostics.warnings).toContain(
      'missing requested price for req-missing-price; slippage excluded',
    );
    expect(aggregated.diagnostics.anomalies).toContain(
      'rejected execution req-rejected-anomaly has non-zero commission',
    );
    expect(aggregated.diagnostics.anomalies).toContain(
      'rejected execution req-rejected-anomaly has non-zero quantity',
    );
    expect(aggregated.diagnostics.anomalies).toContain(
      'rejected execution req-rejected-anomaly has non-zero price',
    );
  });
});

describe('US202 PerformanceAnalyticsService single execution', () => {
  it('analyzes a single filled execution', () => {
    const service = createService();
    const report = service.analyze({
      analysisId: ANALYSIS_ID,
      executionResults: [createFilledResult('req-single')],
      configuration: defaultConfiguration(),
    });

    expect(report.reportId).toBe(deterministicReportId(ANALYSIS_ID));
    expect(report.totalExecutions).toBe(1);
    expect(report.filledExecutions).toBe(1);
    expect(report.averageSlippage).toBe(0.5);
    expect(Object.isFrozen(report)).toBe(true);
  });
});

describe('US202 PerformanceAnalyticsService multiple executions', () => {
  it('analyzes filled, partial, and rejected executions together', () => {
    const service = createService();
    const report = service.analyze({
      analysisId: 'analysis-us202-multiple',
      executionResults: [
        createFilledResult('req-filled-1'),
        createFilledResult('req-filled-2', { executedPrice: 49, commission: 2 }),
        createFilledResult('req-partial', {
          executedPrice: 201,
          executedQuantity: 2,
          commission: 0.75,
          executionStatus: 'PARTIALLY_FILLED',
        }),
        createFilledResult('req-rejected', {
          executedPrice: 0,
          executedQuantity: 0,
          commission: 0,
          executionStatus: 'REJECTED',
        }),
      ],
      configuration: defaultConfiguration(),
    });

    expect(report.totalExecutions).toBe(4);
    expect(report.partialFilledExecutions).toBe(1);
    expect(report.rejectedExecutions).toBe(1);
    expect(report.totalCommission).toBe(4);
    expect(report.executionSuccessRate).toBe(0.75);
  });
});

describe('US202 PerformanceAnalyticsService validation', () => {
  it('rejects empty analysis id and null execution results', () => {
    const service = createService();

    expect(() =>
      service.analyze({
        analysisId: '',
        executionResults: [],
      }),
    ).toThrow(PerformanceAnalyticsValidationError);
    expect(() =>
      service.analyze({
        analysisId: ANALYSIS_ID,
        executionResults: null,
      }),
    ).toThrow('executionResults are required');
  });

  it('wraps invalid execution results in validation errors', () => {
    const service = createService();
    const invalid = Object.freeze({
      requestId: 'req-invalid',
      fill: Object.freeze({
        fillId: 'fill-invalid',
        requestId: 'req-invalid',
        executedPrice: Number.NaN,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED' as const,
      }),
      commission: 1,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
      executionDuration: 1,
    });

    expect(() =>
      service.analyze({
        analysisId: 'analysis-invalid',
        executionResults: [invalid],
      }),
    ).toThrow(PerformanceAnalyticsValidationError);
  });

  it('wraps createRequest and createConfiguration validation errors', () => {
    const service = createService();
    expect(() => service.createRequest({ analysisId: '', executionResults: [] })).toThrow(
      PerformanceAnalyticsValidationError,
    );
    expect(() =>
      service.createConfiguration({
        requestedPricesByRequestId: { 'req-1': -1 },
      }),
    ).toThrow(PerformanceAnalyticsValidationError);
  });
});

describe('US202 PerformanceAnalyticsService events', () => {
  it('emits started, metrics calculated, and completed events', () => {
    const service = createService();
    service.analyze({
      analysisId: 'analysis-us202-events',
      executionResults: [createFilledResult('req-single')],
      configuration: defaultConfiguration(),
    });

    const events = service.applicationEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      'PerformanceAnalysisStarted',
      'PerformanceMetricsCalculated',
      'PerformanceAnalysisCompleted',
    ]);
    expect(PERFORMANCE_ANALYTICS_EVENT_TYPES).toEqual([
      'PerformanceAnalysisStarted',
      'PerformanceMetricsCalculated',
      'PerformanceAnalysisCompleted',
    ]);

    const metricsEvent = events[1];
    if (metricsEvent?.eventType === 'PerformanceMetricsCalculated') {
      expect(metricsEvent.totalExecutions).toBe(1);
      expect(metricsEvent.averageSlippage).toBe(0.5);
    }

    const completedEvent = events[2];
    if (completedEvent?.eventType === 'PerformanceAnalysisCompleted') {
      expect(completedEvent.reportId).toBe('perf-report-analysis-us202-events');
    }
  });
});

describe('US202 PerformanceAnalyticsService determinism', () => {
  it('returns identical metric content for identical execution collections', () => {
    const first = createService({
      clock: createClock([STARTED_AT, COMPLETED_AT, GENERATED_AT], [100, 101, 102, 103]),
    });
    const second = createService({
      clock: createClock([STARTED_AT, COMPLETED_AT, GENERATED_AT], [100, 101, 102, 103]),
    });

    const input = {
      analysisId: 'analysis-us202-deterministic',
      executionResults: [createFilledResult('req-deterministic')],
      configuration: defaultConfiguration(),
    };

    const firstReport = stablePerformanceReport(first.analyze(input));
    const secondReport = stablePerformanceReport(second.analyze(input));

    expect(firstReport).toEqual(secondReport);
  });
});

describe('US202 PerformanceAnalyticsService idempotency', () => {
  it('returns the cached report for repeated analysis ids', () => {
    const service = createService();
    const input = {
      analysisId: 'analysis-us202-idempotent',
      executionResults: [createFilledResult('req-idempotent')],
      configuration: defaultConfiguration(),
    };

    const first = service.analyze(input);
    const second = service.analyze({
      ...input,
      executionResults: [createFilledResult('req-idempotent', { executedPrice: 999 })],
    });

    expect(second).toBe(first);
    expect(service.metrics().reportsGenerated).toBe(1);
    expect(service.lastReport('analysis-us202-idempotent')).toBe(first);
  });

  it('can reject duplicate analysis ids when configured', () => {
    const service = createService({ rejectDuplicateAnalysisIds: true });
    const input = {
      analysisId: 'analysis-us202-duplicate',
      executionResults: [createFilledResult('req-idempotent')],
      configuration: defaultConfiguration(),
    };
    service.analyze(input);

    expect(() => service.analyze(input)).toThrow(PerformanceAnalyticsDuplicateAnalysisError);
  });
});

describe('US202 PerformanceAnalyticsService metrics', () => {
  it('collects analysis duration, reports generated, and execution results processed', () => {
    const service = createService({
      clock: createClock(
        [STARTED_AT, COMPLETED_AT, GENERATED_AT, STARTED_AT, COMPLETED_AT, GENERATED_AT],
        [1_000, 1_004, 1_006, 1_008, 2_000, 2_002, 2_004, 2_006],
      ),
    });

    service.analyze({
      analysisId: 'analysis-us202-metrics-1',
      executionResults: [createFilledResult('req-metrics-1'), createFilledResult('req-metrics-2')],
      configuration: defaultConfiguration(),
    });
    service.analyze({
      analysisId: 'analysis-us202-metrics-2',
      executionResults: [createFilledResult('req-metrics-3')],
      configuration: defaultConfiguration(),
    });

    expect(service.metrics()).toEqual({
      analysisDuration: 6,
      reportsGenerated: 2,
      executionResultsProcessed: 3,
    });
  });

  it('returns zero metrics before any analysis', () => {
    const service = createService();
    expect(service.metrics()).toEqual({
      analysisDuration: 0,
      reportsGenerated: 0,
      executionResultsProcessed: 0,
    });
  });
});

describe('US202 PerformanceAnalyticsService default clock', () => {
  it('uses the system clock when none is supplied', () => {
    const service = PerformanceAnalyticsService.create();
    const report = service.analyze({
      analysisId: 'analysis-us202-default-clock',
      executionResults: [createFilledResult('req-single')],
      configuration: defaultConfiguration(),
    });

    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('US202 PerformanceAnalyticsService commission and slippage aggregation', () => {
  it('aggregates commission and slippage across executions', () => {
    const service = createService();
    const report = service.analyze({
      analysisId: 'analysis-us202-commission-slippage',
      executionResults: [
        createFilledResult('req-filled-1', { executedPrice: 100.5, commission: 1.25 }),
        createFilledResult('req-filled-2', { executedPrice: 49, commission: 2 }),
      ],
      configuration: defaultConfiguration(),
    });

    expect(report.totalCommission).toBe(3.25);
    expect(report.averageCommission).toBe(1.625);
    expect(report.averageSlippage).toBe(0.75);
  });
});

describe('US202 PerformanceAnalyticsService diagnostics', () => {
  it('returns diagnostics on the performance report', () => {
    const service = createService();
    const report = service.analyze({
      analysisId: 'analysis-us202-diagnostics',
      executionResults: [
        createFilledResult('req-diagnostics-warning', {
          executedPrice: 201,
          executedQuantity: 2,
          commission: 0,
          executionStatus: 'PARTIALLY_FILLED',
        }),
      ],
      configuration: createPerformanceAnalyticsConfiguration({
        requestedPricesByRequestId: { 'req-diagnostics-warning': 200 },
      }),
    });

    expect(report.diagnostics.warnings).toContain(
      'partial fill req-diagnostics-warning has zero commission',
    );
    expect(report.diagnostics.validationMessages).toContain('validated 1 execution results');
  });
});

describe('US202 factory and helper edge cases', () => {
  it('validates remaining report and diagnostics factory branches', () => {
    expect(() =>
      createPerformanceDiagnostics({
        warnings: null as unknown as readonly string[],
        anomalies: [],
        validationMessages: [],
      }),
    ).toThrow('warnings are required');
    expect(() =>
      createPerformanceReport({
        reportId: 'report-1',
        generatedAt: GENERATED_AT,
        totalExecutions: -1,
        filledExecutions: 0,
        partialFilledExecutions: 0,
        rejectedExecutions: 0,
        totalCommission: 0,
        averageCommission: 0,
        averageExecutionPrice: 0,
        averageSlippage: 0,
        executionSuccessRate: 0,
        averageExecutionDuration: 0,
        diagnostics: createPerformanceDiagnostics({
          warnings: [],
          anomalies: [],
          validationMessages: [],
        }),
      }),
    ).toThrow('totalExecutions must be a non-negative integer');
    expect(() =>
      createPerformanceReport({
        reportId: 'report-1',
        generatedAt: GENERATED_AT,
        totalExecutions: 1,
        filledExecutions: 0,
        partialFilledExecutions: 0,
        rejectedExecutions: 0,
        totalCommission: -1,
        averageCommission: 0,
        averageExecutionPrice: 0,
        averageSlippage: 0,
        executionSuccessRate: -0.1,
        averageExecutionDuration: 0,
        diagnostics: createPerformanceDiagnostics({
          warnings: [],
          anomalies: [],
          validationMessages: [],
        }),
      }),
    ).toThrow('totalCommission must be a non-negative number');
    expect(() =>
      createPerformanceReport({
        reportId: 'report-1',
        generatedAt: GENERATED_AT,
        totalExecutions: 1,
        filledExecutions: 0,
        partialFilledExecutions: 0,
        rejectedExecutions: 0,
        totalCommission: 0,
        averageCommission: 0,
        averageExecutionPrice: 0,
        averageSlippage: 0,
        executionSuccessRate: -0.1,
        averageExecutionDuration: 0,
        diagnostics: createPerformanceDiagnostics({
          warnings: [],
          anomalies: [],
          validationMessages: [],
        }),
      }),
    ).toThrow('executionSuccessRate must be a number between 0 and 1');
  });

  it('records zero-quantity fill anomalies and handles non-error validation failures', () => {
    const aggregated = aggregateExecutionMetrics(
      [
        createFilledResult('req-zero-qty-filled', {
          executedQuantity: 0,
          executedPrice: 0,
        }),
      ],
      createPerformanceAnalyticsConfiguration({
        requestedPricesByRequestId: { 'req-zero-qty-filled': 100 },
      }),
    );
    expect(aggregated.diagnostics.anomalies).toContain(
      'filled execution req-zero-qty-filled has zero quantity',
    );

    const service = createService();
    const aggregateSpy = vi
      .spyOn(calculatePerformanceMetricsModule, 'aggregateExecutionMetrics')
      .mockImplementation(() => {
        throw 'invalid execution results';
      });

    expect(() =>
      service.analyze({
        analysisId: 'analysis-non-error',
        executionResults: [createFilledResult('req-single')],
      }),
    ).toThrow('Invalid execution results');

    aggregateSpy.mockRestore();

    const requestSpy = vi
      .spyOn(performanceAnalysisRequestModule, 'createPerformanceAnalysisRequest')
      .mockImplementation(() => {
        throw 'invalid analysis request';
      });
    expect(() =>
      service.createRequest({
        analysisId: ANALYSIS_ID,
        executionResults: [],
      }),
    ).toThrow('Invalid analysis request');
    requestSpy.mockRestore();

    const configurationSpy = vi
      .spyOn(performanceAnalyticsConfigurationModule, 'createPerformanceAnalyticsConfiguration')
      .mockImplementation(() => {
        throw 'invalid configuration';
      });
    expect(() => service.createConfiguration()).toThrow('Invalid configuration');
    configurationSpy.mockRestore();
  });

  it('returns null from lastReport when no cached report exists', () => {
    const service = createService();
    expect(service.lastReport('missing-analysis')).toBeNull();
  });
});
