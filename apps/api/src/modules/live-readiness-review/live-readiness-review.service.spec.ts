import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChaosTestingService, createPredefinedChaosTestingConfiguration } from '../chaos-testing';
import {
  DeterministicReplayValidationService,
  createDeterministicReplayValidationResult,
} from '../deterministic-replay-validation';
import { ExecutionStatus, SmokeBacktestService, createExecutionResult } from '../smoke-backtest';
import { RunnerStatus } from '../paper-trading-runner';
import {
  PerformanceBenchmarkService,
  createBenchmarkResult,
  createBenchmarkSuiteResult,
  createPredefinedBenchmarkSuiteConfiguration,
} from '../performance-benchmark';
import {
  RegressionSuiteService,
  createPredefinedRegressionSuiteConfiguration,
  createRegressionScenarioResult,
  createRegressionSuiteResult,
} from '../regression-suite';
import {
  LIVE_READINESS_REVIEW_EVENT_TYPES,
  LIVE_READINESS_REVIEW_ID,
  LiveReadinessReviewAlreadyCompletedError,
  LiveReadinessReviewDuplicateExecutionError,
  LiveReadinessReviewExecutionFailedError,
  LiveReadinessReviewService,
  LiveReadinessReviewValidationError,
  OVERALL_READINESS_STATUSES,
  READINESS_CATEGORIES,
  aggregateLiveReadinessReport,
  buildReadinessCategoryResult,
  createExecutionServiceFactories,
  createLiveReadinessReport,
  createLiveReadinessReviewConfiguration,
  createLiveReadinessReviewMetrics,
  createPredefinedLiveReadinessReviewConfiguration,
  createReadinessCheck,
  createReadinessCategoryResult,
  deriveCategoryStatus,
  deriveOverallReadinessStatus,
  generateCategoryRecommendations,
  generateWarningRecommendations,
  isOverallReadinessStatus,
  isReadinessCategory,
  predefinedLiveReadinessBenchmarkEntries,
  verifyArchitectureReadiness,
  verifyConfigurationReadiness,
  verifyDiagnosticsReadiness,
  verifyExecutionReadiness,
  type LiveReadinessReviewServiceDependencies,
  type ReadinessCategoryResult,
} from './index';

const REVIEW_START = '2026-07-20T18:00:00.000Z';
const CATEGORY_TICK = '2026-07-20T18:00:01.000Z';
const REVIEW_COMPLETED = '2026-07-20T18:30:00.000Z';

function createClock(times: string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function defaultClock(): () => string {
  return createClock([
    REVIEW_START,
    ...Array.from({ length: 50_000 }, () => CATEGORY_TICK),
    REVIEW_COMPLETED,
  ]);
}

function createService(
  overrides: Partial<LiveReadinessReviewServiceDependencies> & {
    clockTimes?: string[];
    usePredefinedConfiguration?: boolean;
  } = {},
): LiveReadinessReviewService {
  const { clockTimes: _clockTimes, usePredefinedConfiguration, ...dependencyOverrides } = overrides;

  const configuration =
    dependencyOverrides.configuration ??
    (usePredefinedConfiguration === false
      ? createPredefinedLiveReadinessReviewConfiguration()
      : createPredefinedLiveReadinessReviewConfiguration());

  return LiveReadinessReviewService.create({
    clock: dependencyOverrides.clock ?? defaultClock(),
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
    ...dependencyOverrides,
    configuration:
      dependencyOverrides.configuration === undefined
        ? configuration
        : dependencyOverrides.configuration,
  });
}

function baselineExecutionResult(
  overrides: Partial<Parameters<typeof createExecutionResult>[0]> = {},
) {
  return createExecutionResult({
    sessionId: 'readiness-session',
    runnerStatus: RunnerStatus.STOPPED,
    executionStatus: ExecutionStatus.COMPLETED,
    cyclesExecuted: 1,
    startedAt: REVIEW_START,
    completedAt: REVIEW_COMPLETED,
    duration: 0,
    eventsPublished: 0,
    errors: Object.freeze([]),
    datasetId: null,
    candlesProcessed: 1,
    replayCompleted: true,
    ...overrides,
  });
}

function passedCategory(category: ReadinessCategoryResult['category']): ReadinessCategoryResult {
  return buildReadinessCategoryResult(category, [
    createReadinessCheck({
      checkId: `${category.toLowerCase()}-passed`,
      description: `${category} check passed`,
      passed: true,
      warning: false,
    }),
  ]);
}

function failedCategory(category: ReadinessCategoryResult['category']): ReadinessCategoryResult {
  return buildReadinessCategoryResult(
    category,
    [
      createReadinessCheck({
        checkId: `${category.toLowerCase()}-failed`,
        description: `${category} check failed`,
        passed: false,
        warning: false,
      }),
    ],
    [`Fix ${category}`],
  );
}

function warningCategory(category: ReadinessCategoryResult['category']): ReadinessCategoryResult {
  return buildReadinessCategoryResult(
    category,
    [
      createReadinessCheck({
        checkId: `${category.toLowerCase()}-warning`,
        description: `${category} check warning`,
        passed: true,
        warning: true,
      }),
    ],
    generateWarningRecommendations(category, [
      createReadinessCheck({
        checkId: `${category.toLowerCase()}-warning`,
        description: `${category} check warning`,
        passed: true,
        warning: true,
      }),
    ]),
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US200 ReadinessCategory', () => {
  it('identifies supported readiness categories', () => {
    for (const category of READINESS_CATEGORIES) {
      expect(isReadinessCategory(category)).toBe(true);
    }
    expect(isReadinessCategory('Unknown')).toBe(false);
    expect(isReadinessCategory(42)).toBe(false);
  });
});

describe('US200 OverallReadinessStatus', () => {
  it('identifies supported overall readiness statuses', () => {
    for (const status of OVERALL_READINESS_STATUSES) {
      expect(isOverallReadinessStatus(status)).toBe(true);
    }
    expect(isOverallReadinessStatus('MAYBE')).toBe(false);
  });
});

describe('US200 ReadinessCheck', () => {
  it('validates required fields', () => {
    expect(() =>
      createReadinessCheck({
        checkId: '',
        description: 'desc',
        passed: true,
        warning: false,
      }),
    ).toThrow('checkId is required');
  });
});

describe('US200 deriveCategoryStatus', () => {
  it('derives FAILED when a non-warning check fails', () => {
    expect(
      deriveCategoryStatus([
        createReadinessCheck({
          checkId: 'a',
          description: 'a',
          passed: false,
          warning: false,
        }),
      ]),
    ).toBe('FAILED');
  });

  it('derives WARNING when only warning checks are present', () => {
    expect(
      deriveCategoryStatus([
        createReadinessCheck({
          checkId: 'a',
          description: 'a',
          passed: true,
          warning: true,
        }),
      ]),
    ).toBe('WARNING');
  });

  it('derives PASSED when all checks pass without warnings', () => {
    expect(
      deriveCategoryStatus([
        createReadinessCheck({
          checkId: 'a',
          description: 'a',
          passed: true,
          warning: false,
        }),
      ]),
    ).toBe('PASSED');
  });
});

describe('US200 deriveOverallReadinessStatus', () => {
  it('derives NOT_READY when any category failed', () => {
    expect(
      deriveOverallReadinessStatus([passedCategory('Execution'), failedCategory('Determinism')]),
    ).toBe('NOT_READY');
  });

  it('derives READY_WITH_WARNINGS when categories have warnings only', () => {
    expect(
      deriveOverallReadinessStatus([passedCategory('Execution'), warningCategory('Diagnostics')]),
    ).toBe('READY_WITH_WARNINGS');
  });

  it('derives READY when all categories passed', () => {
    expect(
      deriveOverallReadinessStatus([passedCategory('Execution'), passedCategory('Determinism')]),
    ).toBe('READY');
  });
});

describe('US200 LiveReadinessReport', () => {
  it('aggregates category results deterministically', () => {
    const report = aggregateLiveReadinessReport(
      LIVE_READINESS_REVIEW_ID,
      [passedCategory('Execution'), failedCategory('Performance')],
      REVIEW_START,
      REVIEW_COMPLETED,
    );

    expect(report.overallStatus).toBe('NOT_READY');
    expect(report.passedChecks).toBe(1);
    expect(report.failedChecks).toBe(1);
    expect(report.recommendations).toContain('Fix Performance');
    expect(report.duration).toBeGreaterThanOrEqual(0);
  });

  it('validates report timestamps', () => {
    expect(() =>
      createLiveReadinessReport({
        reviewId: LIVE_READINESS_REVIEW_ID,
        startedAt: 'invalid',
        completedAt: REVIEW_COMPLETED,
        duration: 0,
        overallStatus: 'READY',
        categoryResults: [],
        passedChecks: 0,
        failedChecks: 0,
        warnings: [],
        recommendations: [],
      }),
    ).toThrow('startedAt must be an ISO-8601 UTC timestamp');
  });
});

describe('US200 LiveReadinessReviewConfiguration', () => {
  it('rejects missing benchmark suite', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        benchmarkConfiguration: null,
      }),
    ).toThrow('benchmarkConfiguration is required');
  });

  it('rejects missing regression suite', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        regressionConfiguration: null,
      }),
    ).toThrow('regressionConfiguration is required');
  });

  it('rejects missing chaos suite', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        chaosConfiguration: null,
      }),
    ).toThrow('chaosConfiguration is required');
  });

  it('rejects missing deterministic validation dataset', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        deterministicDataset: null,
      }),
    ).toThrow('deterministicDataset is required');
  });

  it('rejects missing deterministic validation configuration', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        deterministicConfiguration: null,
      }),
    ).toThrow('deterministicConfiguration is required');
  });
});

describe('US200 recommendation generation', () => {
  it('generates recommendations for failed checks', () => {
    const recommendations = generateCategoryRecommendations('Execution', [
      createReadinessCheck({
        checkId: 'execution-pipeline-complete',
        description: 'Execution pipeline completes a smoke backtest cycle',
        passed: false,
        warning: false,
      }),
    ]);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((item) => item.includes('execution-pipeline-complete'))).toBe(true);
  });

  it('returns no recommendations when all checks passed', () => {
    expect(
      generateCategoryRecommendations('Execution', [
        createReadinessCheck({
          checkId: 'ok',
          description: 'ok',
          passed: true,
          warning: false,
        }),
      ]),
    ).toEqual([]);
  });

  it('generates warning recommendations', () => {
    const recommendations = generateWarningRecommendations('Diagnostics', [
      createReadinessCheck({
        checkId: 'warn',
        description: 'diagnostics latency elevated',
        passed: true,
        warning: true,
      }),
    ]);

    expect(recommendations[0]).toContain('[Diagnostics]');
  });
});

describe('US200 architecture and configuration verifiers', () => {
  it('verifies architecture readiness structurally', () => {
    const result = verifyArchitectureReadiness();
    expect(result.category).toBe('Architecture');
    expect(result.status).toBe('PASSED');
    expect(result.checks.length).toBe(3);
  });

  it('verifies configuration readiness for predefined configuration', () => {
    const result = verifyConfigurationReadiness({
      configuration: createPredefinedLiveReadinessReviewConfiguration(),
    });
    expect(result.category).toBe('Configuration');
    expect(result.status).toBe('PASSED');
  });
});

describe('US200 LiveReadinessReviewService creation', () => {
  it('requires configuration', () => {
    expect(() => LiveReadinessReviewService.create({ configuration: null })).toThrow(
      LiveReadinessReviewValidationError,
    );
  });

  it('requires workspaceId', () => {
    expect(() =>
      LiveReadinessReviewService.create({
        configuration: createPredefinedLiveReadinessReviewConfiguration(),
        workspaceId: '   ',
      }),
    ).toThrow('workspaceId is required');
  });

  it('requires strategyId', () => {
    expect(() =>
      LiveReadinessReviewService.create({
        configuration: createPredefinedLiveReadinessReviewConfiguration(),
        strategyId: '',
      }),
    ).toThrow('strategyId is required');
  });

  it('wraps configuration validation errors from the configuration factory', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      LiveReadinessReviewService.create({
        configuration: {
          ...configuration,
          reviewId: '   ',
        },
      }),
    ).toThrow(LiveReadinessReviewValidationError);
  });
});

describe('US200 LiveReadinessReviewService READY', () => {
  it('executes predefined review and returns READY', async () => {
    const service = createService();

    const report = await service.execute();

    expect(report.overallStatus).toBe('READY');
    expect(report.categoryResults).toHaveLength(READINESS_CATEGORIES.length);
    expect(report.failedChecks).toBe(0);
    expect(report.reviewId).toBe(LIVE_READINESS_REVIEW_ID);
    expect(service.lastReport()).toBe(report);
    expect(service.metrics()?.passed).toBeGreaterThan(0);
  });

  it('emits review lifecycle events', async () => {
    const service = createService();
    await service.execute();
    const events = service.domainEvents();

    expect(events[0]?.eventType).toBe('ReviewStarted');
    expect(events.some((event) => event.eventType === 'CategoryVerified')).toBe(true);
    expect(events.at(-1)?.eventType).toBe('ReviewCompleted');
    expect(LIVE_READINESS_REVIEW_EVENT_TYPES).toContain('ReviewStarted');
  });

  it('returns cached report on repeated execute()', async () => {
    const service = createService();
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);
  });

  it('rejects duplicate concurrent execute()', async () => {
    const service = createService({ rejectOnRepeat: true });
    await service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(
      LiveReadinessReviewAlreadyCompletedError,
    );
  });
});

describe('US200 LiveReadinessReviewService NOT_READY', () => {
  it('returns NOT_READY when benchmark suite fails', async () => {
    const service = createService({
      createPerformanceBenchmarkService: () =>
        ({
          execute: vi.fn(async () =>
            createBenchmarkSuiteResult({
              suiteId: 'benchmark-failed',
              benchmarkResults: [
                createBenchmarkResult({
                  benchmarkId: 'benchmark-smoke',
                  scenario: 'Smoke',
                  startedAt: REVIEW_START,
                  completedAt: REVIEW_COMPLETED,
                  duration: 1,
                  datasetsProcessed: 0,
                  windowsProcessed: 0,
                  candlesProcessed: 0,
                  cyclesProcessed: 0,
                  throughputCandlesPerSecond: 0,
                  throughputCyclesPerSecond: 0,
                  success: false,
                }),
              ],
              totalDuration: 1,
              averageThroughput: 0,
              maximumDuration: 1,
              minimumDuration: 1,
            }),
          ),
        }) as unknown as PerformanceBenchmarkService,
    });

    const report = await service.execute();
    expect(report.overallStatus).toBe('NOT_READY');
    expect(report.categoryResults.find((result) => result.category === 'Performance')?.status).toBe(
      'FAILED',
    );
  });

  it('returns NOT_READY when regression suite fails', async () => {
    const service = createService({
      createRegressionSuiteService: () =>
        ({
          execute: vi.fn(async () =>
            createRegressionSuiteResult({
              suiteId: 'regression-failed',
              scenariosExecuted: 1,
              scenariosPassed: 0,
              scenariosFailed: 1,
              regressionsDetected: 1,
              scenarioResults: [
                createRegressionScenarioResult({
                  scenarioId: 'regression-smoke',
                  scenarioType: 'Smoke',
                  passed: false,
                  regressionDetected: true,
                  mismatches: Object.freeze([]),
                  startedAt: REVIEW_START,
                  completedAt: REVIEW_COMPLETED,
                  duration: 1,
                }),
              ],
              startedAt: REVIEW_START,
              completedAt: REVIEW_COMPLETED,
              duration: 1,
            }),
          ),
        }) as unknown as RegressionSuiteService,
    });

    const report = await service.execute();
    expect(report.overallStatus).toBe('NOT_READY');
    expect(report.categoryResults.find((result) => result.category === 'Regression')?.status).toBe(
      'FAILED',
    );
  });

  it('returns NOT_READY when chaos suite fails', async () => {
    const service = createService({
      createChaosTestingService: () =>
        ({
          execute: vi.fn(async () => ({
            suiteId: 'chaos-failed',
            scenariosExecuted: 1,
            scenariosPassed: 0,
            scenariosFailed: 1,
            scenarioResults: Object.freeze([]),
            startedAt: REVIEW_START,
            completedAt: REVIEW_COMPLETED,
            duration: 1,
          })),
        }) as unknown as ChaosTestingService,
    });

    const report = await service.execute();
    expect(report.overallStatus).toBe('NOT_READY');
    expect(report.categoryResults.find((result) => result.category === 'Chaos')?.status).toBe(
      'FAILED',
    );
  });

  it('returns NOT_READY when deterministic validation fails', async () => {
    const service = createService({
      createDeterministicReplayValidationService: () =>
        ({
          execute: vi.fn(async () =>
            createDeterministicReplayValidationResult({
              validationId: 'validation-failed',
              iterations: 2,
              successfulIterations: 1,
              failedIterations: 1,
              deterministic: false,
              mismatches: Object.freeze([]),
              baselineResult: baselineExecutionResult(),
              comparedResults: Object.freeze([]),
              startedAt: REVIEW_START,
              completedAt: REVIEW_COMPLETED,
              duration: 1,
            }),
          ),
        }) as unknown as DeterministicReplayValidationService,
    });

    const report = await service.execute();
    expect(report.overallStatus).toBe('NOT_READY');
    expect(report.categoryResults.find((result) => result.category === 'Determinism')?.status).toBe(
      'FAILED',
    );
  });
});

describe('US200 LiveReadinessReviewService READY_WITH_WARNINGS', () => {
  it('returns READY_WITH_WARNINGS when a category reports warnings only', async () => {
    const service = createService({
      verifyDiagnostics: vi.fn(async () => warningCategory('Diagnostics')),
    });

    const report = await service.execute();
    expect(report.overallStatus).toBe('READY_WITH_WARNINGS');
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.categoryResults.find((result) => result.category === 'Diagnostics')?.status).toBe(
      'WARNING',
    );
  });
});

describe('US200 LiveReadinessReviewService category coverage', () => {
  it('verifies all configured categories in deterministic order', async () => {
    const verifiedCategories: string[] = [];
    const service = createService({
      verifyExecution: vi.fn(async () => {
        verifiedCategories.push('Execution');
        return passedCategory('Execution');
      }),
      verifyArchitecture: vi.fn(() => {
        verifiedCategories.push('Architecture');
        return passedCategory('Architecture');
      }),
      verifyDiagnostics: vi.fn(async () => {
        verifiedCategories.push('Diagnostics');
        return passedCategory('Diagnostics');
      }),
      verifyConfiguration: vi.fn(() => {
        verifiedCategories.push('Configuration');
        return passedCategory('Configuration');
      }),
      createPerformanceBenchmarkService: () =>
        ({
          execute: vi.fn(async () => {
            verifiedCategories.push('Performance');
            return createBenchmarkSuiteResult({
              suiteId: 'benchmark-pass',
              benchmarkResults: Object.freeze([]),
              totalDuration: 0,
              averageThroughput: 0,
              maximumDuration: 0,
              minimumDuration: 0,
            });
          }),
        }) as unknown as PerformanceBenchmarkService,
      createRegressionSuiteService: () =>
        ({
          execute: vi.fn(async () => {
            verifiedCategories.push('Regression');
            return createRegressionSuiteResult({
              suiteId: 'regression-pass',
              scenariosExecuted: 0,
              scenariosPassed: 0,
              scenariosFailed: 0,
              regressionsDetected: 0,
              scenarioResults: Object.freeze([]),
              startedAt: REVIEW_START,
              completedAt: REVIEW_COMPLETED,
              duration: 0,
            });
          }),
        }) as unknown as RegressionSuiteService,
      createChaosTestingService: () =>
        ({
          execute: vi.fn(async () => {
            verifiedCategories.push('Chaos');
            return {
              suiteId: 'chaos-pass',
              scenariosExecuted: 0,
              scenariosPassed: 0,
              scenariosFailed: 0,
              scenarioResults: Object.freeze([]),
              startedAt: REVIEW_START,
              completedAt: REVIEW_COMPLETED,
              duration: 0,
            };
          }),
        }) as unknown as ChaosTestingService,
      createDeterministicReplayValidationService: () =>
        ({
          execute: vi.fn(async () => {
            verifiedCategories.push('Determinism');
            return createDeterministicReplayValidationResult({
              validationId: 'validation-pass',
              iterations: 2,
              successfulIterations: 2,
              failedIterations: 0,
              deterministic: true,
              mismatches: Object.freeze([]),
              baselineResult: baselineExecutionResult(),
              comparedResults: Object.freeze([]),
              startedAt: REVIEW_START,
              completedAt: REVIEW_COMPLETED,
              duration: 0,
            });
          }),
        }) as unknown as DeterministicReplayValidationService,
    });

    await service.execute();
    expect(verifiedCategories).toEqual([
      'Execution',
      'Determinism',
      'Performance',
      'Regression',
      'Chaos',
      'Diagnostics',
      'Configuration',
      'Architecture',
    ]);
  });
});

describe('US200 LiveReadinessReviewService validation and metrics', () => {
  it('collects review metrics after completion', async () => {
    const service = createService();
    await service.execute();
    const metrics = service.metrics();

    expect(metrics).not.toBeNull();
    expect(createLiveReadinessReviewMetrics(metrics as NonNullable<typeof metrics>)).toEqual(
      metrics,
    );
    expect(metrics?.totalChecks).toBeGreaterThan(0);
    expect(metrics?.reviewDuration).toBeGreaterThanOrEqual(0);
  });

  it('rejects concurrent in-flight execution', async () => {
    const service = createService({
      verifyExecution: vi.fn(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 25);
        });
        return passedCategory('Execution');
      }),
    });

    const first = service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(
      LiveReadinessReviewDuplicateExecutionError,
    );
    await first;
  });

  it('validates unsupported category through verifyCategory switch default', async () => {
    const service = createService();
    await expect(
      (
        service as unknown as {
          verifyCategory: (category: string) => Promise<ReadinessCategoryResult>;
        }
      ).verifyCategory('Unsupported'),
    ).rejects.toBeInstanceOf(LiveReadinessReviewValidationError);
  });
});

describe('US200 LiveReadinessReviewService predefined configuration', () => {
  it('creates predefined configuration with all required suites', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(configuration.reviewId).toBe(LIVE_READINESS_REVIEW_ID);
    expect(configuration.benchmarkConfiguration.benchmarks.length).toBeGreaterThan(0);
    expect(configuration.regressionConfiguration.scenarios.length).toBeGreaterThan(0);
    expect(configuration.chaosConfiguration.scenarios.length).toBeGreaterThan(0);
    expect(configuration.deterministicDataset.candles.length).toBeGreaterThan(0);
    expect(createPredefinedBenchmarkSuiteConfiguration()).toBeDefined();
    expect(createPredefinedRegressionSuiteConfiguration()).toBeDefined();
    expect(createPredefinedChaosTestingConfiguration()).toBeDefined();
  });
});

describe('US200 ReadinessCategoryResult', () => {
  it('validates nested check and recommendation fields', () => {
    const result = createReadinessCategoryResult({
      category: 'Execution',
      status: 'PASSED',
      checks: [
        createReadinessCheck({
          checkId: 'ok',
          description: 'ok',
          passed: true,
          warning: false,
        }),
      ],
      warnings: [],
      recommendations: ['keep monitoring'],
    });

    expect(result.recommendations).toEqual(['keep monitoring']);
  });

  it('rejects empty recommendation entries', () => {
    expect(() =>
      createReadinessCategoryResult({
        category: 'Execution',
        status: 'FAILED',
        checks: [],
        warnings: [],
        recommendations: [''],
      }),
    ).toThrow('recommendations is required');
  });
});

describe('US200 verifier edge cases', () => {
  it('marks execution services unavailable when factories throw', async () => {
    const result = await verifyExecutionReadiness({
      factories: {
        createSmokeBacktestService: () => {
          throw new Error('smoke unavailable');
        },
        createHistoricalReplayService: () => {
          throw new Error('historical unavailable');
        },
        createWalkForwardValidationService: () => {
          throw new Error('walk-forward unavailable');
        },
        createMultiYearResearchService: () => {
          throw new Error('multi-year unavailable');
        },
      },
    });

    expect(result.status).toBe('FAILED');
    expect(result.checks.every((check) => !check.passed)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('marks execution pipeline incomplete when smoke execute throws', async () => {
    const result = await verifyExecutionReadiness({
      factories: {
        createSmokeBacktestService: () =>
          ({
            execute: vi.fn(async () => {
              throw new Error('pipeline failed');
            }),
          }) as never,
        createHistoricalReplayService: () => ({ execute: vi.fn() }) as never,
        createWalkForwardValidationService: () => ({ execute: vi.fn() }) as never,
        createMultiYearResearchService: () => ({ execute: vi.fn() }) as never,
      },
    });

    expect(
      result.checks.find((check) => check.checkId === 'execution-pipeline-complete')?.passed,
    ).toBe(false);
  });

  it('creates execution service factories from benchmark context', () => {
    const factories = createExecutionServiceFactories({ clock: defaultClock() });
    expect(typeof factories.createSmokeBacktestService).toBe('function');
    expect(typeof factories.createHistoricalReplayService).toBe('function');
  });

  it('handles diagnostics infrastructure failure verifier errors', async () => {
    const createSpy = vi.spyOn(SmokeBacktestService, 'create').mockImplementation(() => {
      throw new Error('cannot create smoke service');
    });

    const result = await verifyDiagnosticsReadiness({
      clock: defaultClock(),
      factories: createExecutionServiceFactories({ clock: defaultClock() }),
    });

    expect(
      result.checks.find((check) => check.checkId === 'diagnostics-infrastructure-failures')
        ?.passed,
    ).toBe(false);

    createSpy.mockRestore();
  });

  it('handles diagnostics verifier failures', async () => {
    const result = await verifyDiagnosticsReadiness({
      clock: defaultClock(),
      factories: {
        createSmokeBacktestService: () => {
          throw new Error('diagnostics smoke failed');
        },
        createHistoricalReplayService: () => ({ execute: vi.fn() }) as never,
        createWalkForwardValidationService: () => ({ execute: vi.fn() }) as never,
        createMultiYearResearchService: () => ({ execute: vi.fn() }) as never,
      },
    });

    expect(result.status).toBe('FAILED');
  });

  it('returns empty warning recommendations when no warning checks exist', () => {
    expect(generateWarningRecommendations('Execution', [])).toEqual([]);
  });

  it('reports configuration failure for invalid predefined configuration input', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    const result = verifyConfigurationReadiness({
      configuration: {
        ...configuration,
        deterministicDataset: {
          ...configuration.deterministicDataset,
          candles: Object.freeze([]),
        },
      } as never,
    });

    expect(result.status).toBe('FAILED');
  });

  it('exposes predefined benchmark entries', () => {
    expect(predefinedLiveReadinessBenchmarkEntries().length).toBeGreaterThan(0);
  });
});

describe('US200 LiveReadinessReviewService suite execution errors', () => {
  it('handles thrown benchmark execution errors', async () => {
    const service = createService({
      createPerformanceBenchmarkService: () =>
        ({
          execute: vi.fn(async () => {
            throw new Error('benchmark execution failed');
          }),
        }) as unknown as PerformanceBenchmarkService,
    });

    const report = await service.execute();
    expect(report.categoryResults.find((result) => result.category === 'Performance')?.status).toBe(
      'FAILED',
    );
    expect(
      report.categoryResults
        .find((result) => result.category === 'Performance')
        ?.recommendations.some((item) => item.includes('benchmark execution failed')),
    ).toBe(true);
  });

  it('handles thrown regression execution errors', async () => {
    const service = createService({
      createRegressionSuiteService: () =>
        ({
          execute: vi.fn(async () => {
            throw new Error('regression execution failed');
          }),
        }) as unknown as RegressionSuiteService,
    });

    const report = await service.execute();
    expect(report.categoryResults.find((result) => result.category === 'Regression')?.status).toBe(
      'FAILED',
    );
  });

  it('handles thrown chaos execution errors', async () => {
    const service = createService({
      createChaosTestingService: () =>
        ({
          execute: vi.fn(async () => {
            throw new Error('chaos execution failed');
          }),
        }) as unknown as ChaosTestingService,
    });

    const report = await service.execute();
    expect(report.categoryResults.find((result) => result.category === 'Chaos')?.status).toBe(
      'FAILED',
    );
  });

  it('handles thrown deterministic validation execution errors', async () => {
    const service = createService({
      createDeterministicReplayValidationService: () =>
        ({
          execute: vi.fn(async () => {
            throw new Error('deterministic execution failed');
          }),
        }) as unknown as DeterministicReplayValidationService,
    });

    const report = await service.execute();
    expect(report.categoryResults.find((result) => result.category === 'Determinism')?.status).toBe(
      'FAILED',
    );
  });
});

describe('US200 error and metrics factories', () => {
  it('exposes typed execution failed error', () => {
    const error = new LiveReadinessReviewExecutionFailedError('failed', new Error('cause'));
    expect(error.code).toBe('LIVE_READINESS_REVIEW_EXECUTION_FAILED');
    expect(error.cause).toBeInstanceOf(Error);
  });

  it('validates metrics fields', () => {
    expect(() =>
      createLiveReadinessReviewMetrics({
        totalChecks: -1,
        passed: 0,
        failed: 0,
        warnings: 0,
        reviewDuration: 0,
      }),
    ).toThrow('totalChecks must be a non-negative integer');
  });

  it('validates empty reviewId in report', () => {
    expect(() =>
      createLiveReadinessReport({
        reviewId: '',
        startedAt: REVIEW_START,
        completedAt: REVIEW_COMPLETED,
        duration: 0,
        overallStatus: 'READY',
        categoryResults: [],
        passedChecks: 0,
        failedChecks: 0,
        warnings: [],
        recommendations: [],
      }),
    ).toThrow('reviewId is required');
  });

  it('validates negative duration in report', () => {
    expect(() =>
      createLiveReadinessReport({
        reviewId: LIVE_READINESS_REVIEW_ID,
        startedAt: REVIEW_START,
        completedAt: REVIEW_COMPLETED,
        duration: -1,
        overallStatus: 'READY',
        categoryResults: [],
        passedChecks: 0,
        failedChecks: 0,
        warnings: [],
        recommendations: [],
      }),
    ).toThrow('duration must be a non-negative integer');
  });

  it('rejects empty deterministic dataset in configuration', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        deterministicDataset: {
          ...configuration.deterministicDataset,
          candles: Object.freeze([]),
        },
      }),
    ).toThrow('deterministicDataset must not be empty');
  });

  it('rejects empty reviewId in configuration', () => {
    const configuration = createPredefinedLiveReadinessReviewConfiguration();
    expect(() =>
      createLiveReadinessReviewConfiguration({
        ...configuration,
        reviewId: '   ',
      }),
    ).toThrow('reviewId is required');
  });

  it('maps typed live readiness errors without wrapping', async () => {
    const service = createService({
      verifyExecution: vi.fn(async () => {
        throw new LiveReadinessReviewValidationError('validation failed');
      }),
    });

    await expect(service.execute()).rejects.toBeInstanceOf(LiveReadinessReviewValidationError);
  });

  it('maps Error instances during report creation', async () => {
    const service = createService({
      createReport: () => {
        throw new Error('report failed');
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(LiveReadinessReviewExecutionFailedError);
  });

  it('maps non-error execution failures', async () => {
    const service = createService({
      createReport: () => {
        throw 'unexpected failure';
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(LiveReadinessReviewExecutionFailedError);
  });

  it('exposes review configuration accessor', () => {
    const service = createService();
    expect(service.reviewConfiguration().reviewId).toBe(LIVE_READINESS_REVIEW_ID);
  });
});
