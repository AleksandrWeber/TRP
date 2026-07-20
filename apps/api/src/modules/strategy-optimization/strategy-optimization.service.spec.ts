import { describe, expect, it } from 'vitest';

import { createExecutionPolicy, createExecutionRequest } from '../execution-simulator';
import { createPerformanceAnalyticsConfiguration } from '../performance-analytics';

import {
  createExecutionConfiguration,
  createOptimizationCriteria,
  createStrategyConfiguration,
  createStrategyOptimizationRequest,
  createOptimizationResult,
  createOptimizationReport,
  createOptimizationDiagnostics,
  StrategyOptimizationService,
} from './index';
import {
  StrategyOptimizationAlreadyCompletedError,
  StrategyOptimizationExecutionFailedError,
  StrategyOptimizationConfigurationFailedError,
  StrategyOptimizationDuplicateExecutionError,
  StrategyOptimizationValidationError,
} from './strategy-optimization-errors';
import { STRATEGY_OPTIMIZATION_EVENT_TYPES } from './strategy-optimization-events';
import { createStrategyOptimizationMetrics } from './strategy-optimization-metrics';

const NOW = 1_000;
const ISO_NOW = '2026-07-20T12:00:00.000Z';
const clock = Object.freeze({
  now: () => NOW,
  iso: () => ISO_NOW,
});

function baseExecutionConfiguration() {
  const req1 = createExecutionRequest({
    requestId: 'req-1',
    symbol: 'BTCUSDT',
    side: 'BUY',
    quantity: 4,
    requestedPrice: 100,
    timestamp: '2026-07-20T10:00:00.000Z',
  });
  const req2 = createExecutionRequest({
    requestId: 'req-2',
    symbol: 'BTCUSDT',
    side: 'SELL',
    quantity: 4,
    requestedPrice: 50,
    timestamp: '2026-07-20T10:01:00.000Z',
  });

  const executionPolicy = createExecutionPolicy({
    allowPartialFill: false,
    deterministicSlippage: 0,
    fixedCommission: 1,
  });

  const performanceAnalyticsConfiguration = createPerformanceAnalyticsConfiguration({
    requestedPricesByRequestId: {
      'req-1': 100,
      'req-2': 50,
    },
  });

  return createExecutionConfiguration({
    executionRequests: [req1, req2],
    executionPolicy,
    performanceAnalyticsConfiguration,
    researchCycles: 1,
  });
}

describe('US203 Strategy Optimization — core factories', () => {
  it('creates an immutable StrategyConfiguration', () => {
    const configuration = createStrategyConfiguration({
      configurationId: 'cfg-1',
      parameters: { deterministicSlippage: 0.5 },
    });
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(configuration.configurationId).toBe('cfg-1');
    expect(Object.isFrozen(configuration.parameters)).toBe(true);
  });

  it('rejects empty configurationId', () => {
    expect(() =>
      createStrategyConfiguration({
        configurationId: '   ',
        parameters: {},
      }),
    ).toThrow('configurationId is required');
  });

  it('creates valid OptimizationCriteria', () => {
    const criteria = createOptimizationCriteria({
      criterion: 'lowestAverageSlippage',
    });
    expect(Object.isFrozen(criteria)).toBe(true);
  });

  it('rejects invalid optimization criteria', () => {
    expect(() =>
      createOptimizationCriteria({
        criterion: 'not-a-criterion' as any,
      }),
    ).toThrow('invalid optimization criteria');
  });

  it('requires weights for customWeightedScore', () => {
    expect(() =>
      createOptimizationCriteria({
        criterion: 'customWeightedScore' as any,
      }),
    ).toThrow('weights are required for customWeightedScore');
  });

  it('rejects invalid customWeightedScore weights', () => {
    expect(() =>
      createOptimizationCriteria({
        criterion: 'customWeightedScore',
        weights: { executionSuccessRate: -1, averageSlippage: 0, totalCommission: 0 },
      }),
    ).toThrow('weights.executionSuccessRate must be a non-negative number');

    expect(() =>
      createOptimizationCriteria({
        criterion: 'customWeightedScore',
        weights: { executionSuccessRate: 0, averageSlippage: 0, totalCommission: 0 },
      }),
    ).toThrow('weights must sum to a positive value');
  });

  it('creates an immutable ExecutionConfiguration and rejects duplicates', () => {
    const requestA = createExecutionRequest({
      requestId: 'dup-1',
      symbol: 'BTCUSDT',
      side: 'BUY',
      quantity: 4,
      requestedPrice: 10,
      timestamp: '2026-07-20T10:00:00.000Z',
    });
    const requestB = createExecutionRequest({
      requestId: 'dup-1',
      symbol: 'BTCUSDT',
      side: 'SELL',
      quantity: 4,
      requestedPrice: 10,
      timestamp: '2026-07-20T10:01:00.000Z',
    });
    const basePolicy = createExecutionPolicy({
      allowPartialFill: false,
      deterministicSlippage: 0,
      fixedCommission: 1,
    });
    const perfConfig = createPerformanceAnalyticsConfiguration({
      requestedPricesByRequestId: {
        'dup-1': 10,
      },
    });

    expect(() =>
      createExecutionConfiguration({
        executionRequests: [requestA, requestB],
        executionPolicy: basePolicy,
        performanceAnalyticsConfiguration: perfConfig,
      }),
    ).toThrow('duplicate execution request id: dup-1');
  });

  it('creates ExecutionConfiguration with default performanceAnalyticsConfiguration and rejects invalid execution inputs', () => {
    const req1 = createExecutionRequest({
      requestId: 'def-req-1',
      symbol: 'BTCUSDT',
      side: 'BUY',
      quantity: 4,
      requestedPrice: 10,
      timestamp: '2026-07-20T10:00:00.000Z',
    });
    const executionPolicy = createExecutionPolicy({
      allowPartialFill: false,
      deterministicSlippage: 0,
      fixedCommission: 1,
    });

    // performanceAnalyticsConfiguration default path.
    const config = createExecutionConfiguration({
      executionRequests: [req1],
      executionPolicy,
      researchCycles: 1,
    });
    expect(config.performanceAnalyticsConfiguration.requestedPricesByRequestId).toEqual({});

    expect(() =>
      createExecutionConfiguration({
        executionRequests: null as any,
        executionPolicy,
      }),
    ).toThrow('executionRequests are required');

    expect(() =>
      createExecutionConfiguration({
        executionRequests: [],
        executionPolicy,
      }),
    ).toThrow('executionRequests must not be empty');

    expect(() =>
      createExecutionConfiguration({
        executionRequests: [req1],
        executionPolicy,
        workspaceId: '   ',
      }),
    ).toThrow('workspaceId is required');

    expect(() =>
      createExecutionConfiguration({
        executionRequests: [req1],
        executionPolicy,
        strategyId: '   ',
      }),
    ).toThrow('strategyId is required');

    expect(() =>
      createExecutionConfiguration({
        executionRequests: [req1],
        executionPolicy,
        researchCycles: 0,
      }),
    ).toThrow('researchCycles must be a positive integer');
  });

  it('creates StrategyOptimizationRequest and rejects duplicate configuration ids', () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'cfg-a',
      parameters: { fixedCommission: 1 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'cfg-a',
      parameters: { fixedCommission: 2 },
    });

    expect(() =>
      createStrategyOptimizationRequest({
        optimizationId: 'opt-1',
        strategyConfigurations: [configA, configB],
        optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestCommission' }),
        executionConfiguration,
      }),
    ).toThrow('duplicate configuration id: cfg-a');
  });

  it('creates OptimizationResult and OptimizationReport immutably', () => {
    const fakeDiagnostics = createOptimizationDiagnostics({
      warnings: [],
      validationMessages: [],
      criteriaApplied: 'test',
    });

    const performanceReport = {
      reportId: 'perf-1',
      generatedAt: ISO_NOW,
      totalExecutions: 1,
      filledExecutions: 1,
      partialFilledExecutions: 0,
      rejectedExecutions: 0,
      totalCommission: 1,
      averageCommission: 1,
      averageExecutionPrice: 100,
      averageSlippage: 0.5,
      executionSuccessRate: 1,
      averageExecutionDuration: 0,
      diagnostics: {
        warnings: [],
        anomalies: [],
        validationMessages: [],
      },
    } as any;

    const result1 = createOptimizationResult({
      configurationId: 'cfg-1',
      performanceReport,
      score: 1.2,
      rank: 1,
    });

    const result2 = createOptimizationResult({
      configurationId: 'cfg-2',
      performanceReport,
      score: 0.8,
      rank: 2,
    });

    expect(Object.isFrozen(result1)).toBe(true);

    const report = createOptimizationReport({
      reportId: 'report-1',
      bestConfiguration: result1,
      rankedResults: [result1, result2],
      diagnostics: fakeDiagnostics,
    });

    expect(Object.isFrozen(report)).toBe(true);
  });

  it('rejects OptimizationResult empty configurationId', () => {
    const performanceReport = {
      reportId: 'perf',
      generatedAt: ISO_NOW,
      totalExecutions: 1,
      filledExecutions: 1,
      partialFilledExecutions: 0,
      rejectedExecutions: 0,
      totalCommission: 1,
      averageCommission: 1,
      averageExecutionPrice: 100,
      averageSlippage: 0.5,
      executionSuccessRate: 1,
      averageExecutionDuration: 0,
      diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
    } as any;

    expect(() =>
      createOptimizationResult({
        configurationId: ' ',
        performanceReport,
        score: 1,
        rank: 1,
      }),
    ).toThrow('configurationId is required');
  });

  it('rejects OptimizationReport missing rankedResults and invalid rank ordering', () => {
    const fakeDiagnostics = createOptimizationDiagnostics({
      warnings: [],
      validationMessages: [],
      criteriaApplied: 'test',
    });

    expect(() =>
      createOptimizationReport({
        reportId: 'report-1',
        bestConfiguration: createOptimizationResult({
          configurationId: 'cfg-1',
          performanceReport: {
            reportId: 'perf',
            generatedAt: ISO_NOW,
            totalExecutions: 1,
            filledExecutions: 1,
            partialFilledExecutions: 0,
            rejectedExecutions: 0,
            totalCommission: 1,
            averageCommission: 1,
            averageExecutionPrice: 100,
            averageSlippage: 0.5,
            executionSuccessRate: 1,
            averageExecutionDuration: 0,
            diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
          } as any,
          score: 1,
          rank: 1,
        }),
        rankedResults: undefined as any,
        diagnostics: fakeDiagnostics,
      }),
    ).toThrow('rankedResults are required');

    expect(() =>
      createOptimizationReport({
        reportId: 'report-1',
        bestConfiguration: createOptimizationResult({
          configurationId: 'cfg-1',
          performanceReport: {
            reportId: 'perf',
            generatedAt: ISO_NOW,
            totalExecutions: 1,
            filledExecutions: 1,
            partialFilledExecutions: 0,
            rejectedExecutions: 0,
            totalCommission: 1,
            averageCommission: 1,
            averageExecutionPrice: 100,
            averageSlippage: 0.5,
            executionSuccessRate: 1,
            averageExecutionDuration: 0,
            diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
          } as any,
          score: 1,
          rank: 1,
        }),
        rankedResults: [],
        diagnostics: fakeDiagnostics,
      }),
    ).toThrow('rankedResults must not be empty');

    const result1 = createOptimizationResult({
      configurationId: 'cfg-1',
      performanceReport: {
        reportId: 'perf',
        generatedAt: ISO_NOW,
        totalExecutions: 1,
        filledExecutions: 1,
        partialFilledExecutions: 0,
        rejectedExecutions: 0,
        totalCommission: 1,
        averageCommission: 1,
        averageExecutionPrice: 100,
        averageSlippage: 0.5,
        executionSuccessRate: 1,
        averageExecutionDuration: 0,
        diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
      } as any,
      score: 1,
      rank: 1,
    });
    const result2 = createOptimizationResult({
      configurationId: 'cfg-2',
      performanceReport: result1.performanceReport,
      score: 0.5,
      rank: 3,
    });

    expect(() =>
      createOptimizationReport({
        reportId: 'report-1',
        bestConfiguration: result1,
        rankedResults: [result1, result2],
        diagnostics: fakeDiagnostics,
      }),
    ).toThrow('rankedResults[1] must have rank 2');
  });

  it('rejects OptimizationResult invalid score and rank', () => {
    const performanceReport = {
      reportId: 'perf',
      generatedAt: ISO_NOW,
      totalExecutions: 1,
      filledExecutions: 1,
      partialFilledExecutions: 0,
      rejectedExecutions: 0,
      totalCommission: 1,
      averageCommission: 1,
      averageExecutionPrice: 100,
      averageSlippage: 0.5,
      executionSuccessRate: 1,
      averageExecutionDuration: 0,
      diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
    } as any;

    expect(() =>
      createOptimizationResult({
        configurationId: 'cfg-1',
        performanceReport,
        score: NaN,
        rank: 1,
      }),
    ).toThrow('score must be a finite number');

    expect(() =>
      createOptimizationResult({
        configurationId: 'cfg-1',
        performanceReport,
        score: 1,
        rank: 0,
      }),
    ).toThrow('rank must be a positive integer');
  });

  it('rejects OptimizationReport mismatched bestConfiguration and rankedResults', () => {
    const performanceReport = {
      reportId: 'perf',
      generatedAt: ISO_NOW,
      totalExecutions: 1,
      filledExecutions: 1,
      partialFilledExecutions: 0,
      rejectedExecutions: 0,
      totalCommission: 1,
      averageCommission: 1,
      averageExecutionPrice: 100,
      averageSlippage: 0.5,
      executionSuccessRate: 1,
      averageExecutionDuration: 0,
      diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
    } as any;

    const resultTop = createOptimizationResult({
      configurationId: 'cfg-1',
      performanceReport,
      score: 1,
      rank: 1,
    });
    const resultBadBest = createOptimizationResult({
      configurationId: 'cfg-2',
      performanceReport,
      score: 0.5,
      rank: 2,
    });

    const diagnostics = createOptimizationDiagnostics({
      warnings: [],
      validationMessages: [],
      criteriaApplied: 'x',
    });

    expect(() =>
      createOptimizationReport({
        reportId: 'report',
        bestConfiguration: resultBadBest,
        rankedResults: [resultTop, resultBadBest],
        diagnostics,
      }),
    ).toThrow('bestConfiguration must match the highest-ranked result');
  });

  it('rejects OptimizationReport with empty reportId', () => {
    const fakeDiagnostics = createOptimizationDiagnostics({
      warnings: [],
      validationMessages: [],
      criteriaApplied: 'test',
    });

    const performanceReport = {
      reportId: 'perf',
      generatedAt: ISO_NOW,
      totalExecutions: 1,
      filledExecutions: 1,
      partialFilledExecutions: 0,
      rejectedExecutions: 0,
      totalCommission: 1,
      averageCommission: 1,
      averageExecutionPrice: 100,
      averageSlippage: 0.5,
      executionSuccessRate: 1,
      averageExecutionDuration: 0,
      diagnostics: { warnings: [], anomalies: [], validationMessages: [] },
    } as any;

    const bestConfiguration = createOptimizationResult({
      configurationId: 'cfg-1',
      performanceReport,
      score: 1,
      rank: 1,
    });

    expect(() =>
      createOptimizationReport({
        reportId: '   ',
        bestConfiguration,
        rankedResults: [bestConfiguration],
        diagnostics: fakeDiagnostics,
      }),
    ).toThrow('reportId is required');
  });

  it('rejects OptimizationDiagnostics invalid inputs', () => {
    expect(() =>
      createOptimizationDiagnostics({
        warnings: undefined as any,
        validationMessages: [],
        criteriaApplied: 'x',
      }),
    ).toThrow('warnings are required');

    expect(() =>
      createOptimizationDiagnostics({
        warnings: ['   ', 'ok'],
        validationMessages: [],
        criteriaApplied: 'x',
      }),
    ).toThrow('warnings[0] must be a non-empty string');

    expect(() =>
      createOptimizationDiagnostics({
        warnings: [],
        validationMessages: undefined as any,
        criteriaApplied: 'x',
      }),
    ).toThrow('validationMessages are required');

    expect(() =>
      createOptimizationDiagnostics({
        warnings: [],
        validationMessages: [''],
        criteriaApplied: 'x',
      }),
    ).toThrow('validationMessages[0] must be a non-empty string');

    expect(() =>
      createOptimizationDiagnostics({
        warnings: [],
        validationMessages: [],
        criteriaApplied: ' ',
      }),
    ).toThrow('criteriaApplied is required');
  });

  it('instantiates error types used by StrategyOptimizationService', () => {
    // ValidationError constructor branch coverage
    expect(
      () => new (StrategyOptimizationConfigurationFailedError as any)('cfg', 'cause'),
    ).toBeDefined();
    const validationError = new StrategyOptimizationValidationError('msg', { x: 1 });
    expect(validationError.code).toBe('STRATEGY_OPTIMIZATION_VALIDATION');

    const executionFailedError = new StrategyOptimizationExecutionFailedError('exec failed', {
      y: 2,
    });
    expect(executionFailedError.code).toBe('STRATEGY_OPTIMIZATION_EXECUTION_FAILED');
  });

  it('rejects invalid StrategyOptimizationMetrics inputs', () => {
    expect(() =>
      createStrategyOptimizationMetrics({
        configurationsEvaluated: -1,
        optimizationDuration: 0,
        reportsGenerated: 0,
      }),
    ).toThrow('configurationsEvaluated must be a non-negative integer');
  });

  it('rejects invalid StrategyOptimizationRequest inputs', () => {
    const executionConfiguration = baseExecutionConfiguration();
    const criteria = createOptimizationCriteria({ criterion: 'lowestAverageSlippage' });

    expect(() =>
      (createStrategyOptimizationRequest as any)({
        optimizationId: 'opt',
        strategyConfigurations: [],
        optimizationCriteria: criteria,
        executionConfiguration,
      }),
    ).toThrow('strategyConfigurations must not be empty');

    expect(() =>
      (createStrategyOptimizationRequest as any)({
        optimizationId: 'opt',
        strategyConfigurations: null,
        optimizationCriteria: criteria,
        executionConfiguration,
      }),
    ).toThrow('strategyConfigurations are required');

    expect(() =>
      (createStrategyOptimizationRequest as any)({
        optimizationId: 'opt',
        strategyConfigurations: [
          createStrategyConfiguration({
            configurationId: 'cfg-a',
            parameters: {},
          }),
        ],
        optimizationCriteria: criteria,
        executionConfiguration: undefined,
      }),
    ).toThrow('executionConfiguration is required');

    expect(() =>
      (createStrategyOptimizationRequest as any)({
        optimizationId: '  ',
        strategyConfigurations: [
          createStrategyConfiguration({
            configurationId: 'cfg-a',
            parameters: {},
          }),
        ],
        optimizationCriteria: criteria,
        executionConfiguration,
      }),
    ).toThrow('optimizationId is required');
  });
});

describe('US203 Strategy Optimization — service', () => {
  it('exports expected event types', () => {
    expect(STRATEGY_OPTIMIZATION_EVENT_TYPES).toEqual([
      'OptimizationStarted',
      'ConfigurationEvaluated',
      'OptimizationCompleted',
    ]);
  });

  it('ranks configurations by lowestAverageSlippage and produces immutable report', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5, fixedCommission: 1 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5, fixedCommission: 0.25 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-1',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    expect(service.lastReport()).toBeNull();
    expect(service.metrics()).toEqual({
      configurationsEvaluated: 0,
      optimizationDuration: 0,
      reportsGenerated: 0,
    });
    const report = await service.execute();

    expect(report.reportId).toBe('optimization-report-opt-us203-1');
    expect(report.bestConfiguration.configurationId).toBe('config-a');
    expect(report.rankedResults.map((r) => r.rank)).toEqual([1, 2]);
    expect(report.rankedResults[0]!.score).toBeGreaterThan(report.rankedResults[1]!.score);
    expect(report.diagnostics.criteriaApplied).toBe('lowestAverageSlippage');

    // Events: started + N evaluated + completed
    const events = service.applicationEvents();
    expect(events.length).toBe(2 + request.strategyConfigurations.length);
    expect(events[0]!.eventType).toBe('OptimizationStarted');
    expect(events[events.length - 1]!.eventType).toBe('OptimizationCompleted');

    const metrics = service.metrics();
    expect(metrics.configurationsEvaluated).toBe(2);
    expect(metrics.reportsGenerated).toBe(2);
    expect(metrics.optimizationDuration).toBe(0);

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.rankedResults)).toBe(true);

    // lastReport()
    expect(service.lastReport()).toBe(report);
  });

  it('ranks configurations by lowestCommission', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5, fixedCommission: 1 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5, fixedCommission: 0.25 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-lowest-commission',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestCommission' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    const report = await service.execute();

    // lower fixedCommission => lower averageCommission => better rank
    expect(report.bestConfiguration.configurationId).toBe('config-b');
  });

  it('uses deterministic tie-breaking for highestExecutionSuccessRate', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5, fixedCommission: 0.25 },
    });
    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5, fixedCommission: 1 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-2',
      strategyConfigurations: [configB, configA],
      optimizationCriteria: createOptimizationCriteria({
        criterion: 'highestExecutionSuccessRate',
      }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    const report = await service.execute();

    // All success rates are 1, so we break ties by configurationId ascending.
    expect(report.bestConfiguration.configurationId).toBe('config-a');
    expect(report.rankedResults[0]!.configurationId).toBe('config-a');
    expect(report.rankedResults[1]!.configurationId).toBe('config-b');
  });

  it('computes customWeightedScore across all candidates deterministically', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5, fixedCommission: 1 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5, fixedCommission: 0.25 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-3',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({
        criterion: 'customWeightedScore',
        weights: {
          executionSuccessRate: 0.2,
          averageSlippage: 0.5,
          totalCommission: 0.3,
        },
      }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    const report = await service.execute();

    // Expected:
    // success term normalized to 1 for both; only slippage and commission matter.
    // config-a: slippage best (1), commission worst (0) => 0.2*1 + 0.5*1 + 0.3*0 = 0.7
    // config-b: slippage worst (0), commission best (1) => 0.2*1 + 0.5*0 + 0.3*1 = 0.5
    expect(report.bestConfiguration.configurationId).toBe('config-a');

    const aScore = report.rankedResults.find((r) => r.configurationId === 'config-a')!.score;
    const bScore = report.rankedResults.find((r) => r.configurationId === 'config-b')!.score;
    expect(aScore).toBeCloseTo(0.7, 6);
    expect(bScore).toBeCloseTo(0.5, 6);
  });

  it('supports nested executionPolicy overrides and allowPartialFill boolean', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'cfg-a',
      parameters: {
        executionPolicy: {
          deterministicSlippage: 0.25,
          fixedCommission: 1,
          allowPartialFill: true,
        },
      },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'cfg-b',
      parameters: {
        deterministicSlippage: 1.0,
      },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-4',
      strategyConfigurations: [configB, configA],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    const report = await service.execute();

    expect(report.bestConfiguration.configurationId).toBe('cfg-a');
  });

  it('rejects concurrent execute() calls via duplicate execution error', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-5',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    const first = service.execute();

    await expect(service.execute()).rejects.toBeInstanceOf(
      StrategyOptimizationDuplicateExecutionError,
    );
    await first;
  });

  it('rejects repeated execute() when rejectOnRepeat is enabled', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-6',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, {
      clock,
      rejectOnRepeat: true,
    });

    await service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(
      StrategyOptimizationAlreadyCompletedError,
    );
  });

  it('returns the cached report on repeated execute() when rejectOnRepeat is disabled', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.5 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-cache',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock, rejectOnRepeat: false });
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);
  });

  it('wraps invalid configuration overrides as StrategyOptimizationConfigurationFailedError', async () => {
    const executionConfiguration = baseExecutionConfiguration();

    const configBad = createStrategyConfiguration({
      configurationId: 'config-bad',
      parameters: { deterministicSlippage: -1 },
    });
    const configOk = createStrategyConfiguration({
      configurationId: 'config-ok',
      parameters: { deterministicSlippage: 0.5 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-7',
      strategyConfigurations: [configBad, configOk],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request, { clock });
    await expect(service.execute()).rejects.toBeInstanceOf(
      StrategyOptimizationConfigurationFailedError,
    );
  });

  it('works with default clock (default clock is exercised)', async () => {
    const executionConfiguration = baseExecutionConfiguration();
    const configA = createStrategyConfiguration({
      configurationId: 'config-a',
      parameters: { deterministicSlippage: 0.5, fixedCommission: 1 },
    });
    const configB = createStrategyConfiguration({
      configurationId: 'config-b',
      parameters: { deterministicSlippage: 1.0, fixedCommission: 0.5 },
    });

    const request = createStrategyOptimizationRequest({
      optimizationId: 'opt-us203-8',
      strategyConfigurations: [configA, configB],
      optimizationCriteria: createOptimizationCriteria({ criterion: 'lowestAverageSlippage' }),
      executionConfiguration,
    });

    const service = StrategyOptimizationService.create(request);
    const report = await service.execute();
    expect(report.reportId).toBe('optimization-report-opt-us203-8');
  });
});
