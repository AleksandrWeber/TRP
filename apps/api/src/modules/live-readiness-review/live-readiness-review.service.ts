import { ChaosTestingService } from '../chaos-testing';
import {
  DeterministicReplayValidationService,
  type DeterministicReplayValidationServiceDependencies,
} from '../deterministic-replay-validation';
import {
  PerformanceBenchmarkService,
  type PerformanceBenchmarkServiceDependencies,
} from '../performance-benchmark';
import {
  RegressionSuiteService,
  type RegressionSuiteServiceDependencies,
} from '../regression-suite';
import { createDeterministicReplayRegressionDependencies } from '../regression-suite';
import type { BenchmarkScenarioContext } from '../performance-benchmark';
import { verifyArchitectureReadiness } from './architecture-readiness-verifier';
import { verifyConfigurationReadiness } from './configuration-readiness-verifier';
import { verifyDiagnosticsReadiness } from './diagnostics-readiness-verifier';
import {
  createExecutionServiceFactories,
  verifyExecutionReadiness,
  type ExecutionServiceFactories,
} from './execution-readiness-verifier';
import {
  aggregateLiveReadinessReport,
  createLiveReadinessReport,
  type LiveReadinessReport,
} from './live-readiness-report';
import {
  createLiveReadinessReviewConfiguration,
  type LiveReadinessReviewConfiguration,
} from './live-readiness-review-configuration';
import type { LiveReadinessReviewEvent } from './live-readiness-review-events';
import {
  LiveReadinessReviewAlreadyCompletedError,
  LiveReadinessReviewDuplicateExecutionError,
  LiveReadinessReviewError,
  LiveReadinessReviewExecutionFailedError,
  LiveReadinessReviewValidationError,
} from './live-readiness-review-errors';
import {
  createLiveReadinessReviewMetrics,
  type LiveReadinessReviewMetrics,
} from './live-readiness-review-metrics';
import { READINESS_CATEGORIES, type ReadinessCategory } from './readiness-category';
import {
  buildReadinessCategoryResult,
  type ReadinessCategoryResult,
} from './readiness-category-result';
import { createReadinessCheck } from './readiness-check';
import { generateCategoryRecommendations } from './readiness-recommendations';

export type CreateLiveReadinessReportFn = (properties: LiveReadinessReport) => LiveReadinessReport;

export type CreatePerformanceBenchmarkServiceFn = () => PerformanceBenchmarkService;
export type CreateRegressionSuiteServiceFn = () => RegressionSuiteService;
export type CreateChaosTestingServiceFn = () => ChaosTestingService;
export type CreateDeterministicReplayValidationServiceFn =
  () => DeterministicReplayValidationService;

export type LiveReadinessReviewServiceDependencies = Readonly<{
  configuration: LiveReadinessReviewConfiguration | null;
  clock?: () => string;
  createReport?: CreateLiveReadinessReportFn;
  createExecutionServiceFactories?: (
    context: BenchmarkScenarioContext,
  ) => ExecutionServiceFactories;
  createPerformanceBenchmarkService?: CreatePerformanceBenchmarkServiceFn;
  createRegressionSuiteService?: CreateRegressionSuiteServiceFn;
  createChaosTestingService?: CreateChaosTestingServiceFn;
  createDeterministicReplayValidationService?: CreateDeterministicReplayValidationServiceFn;
  verifyExecution?: typeof verifyExecutionReadiness;
  verifyArchitecture?: typeof verifyArchitectureReadiness;
  verifyDiagnostics?: typeof verifyDiagnosticsReadiness;
  verifyConfiguration?: typeof verifyConfigurationReadiness;
  workspaceId?: string;
  strategyId?: string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  /**
   * When true, a repeated execute() after completion rejects with
   * LiveReadinessReviewAlreadyCompletedError instead of returning the cached
   * result.
   */
  rejectOnRepeat?: boolean;
}>;

/**
 * US200 Live Readiness Review application service.
 *
 * Evaluates platform readiness using existing execution, validation,
 * benchmark, regression, and chaos modules. Contains no trading logic.
 */
export class LiveReadinessReviewService {
  private readonly configuration: LiveReadinessReviewConfiguration;
  private readonly clock: () => string;
  private readonly createReport: CreateLiveReadinessReportFn;
  private readonly createExecutionFactories: (
    context: BenchmarkScenarioContext,
  ) => ExecutionServiceFactories;
  private readonly createPerformanceBenchmarkService: CreatePerformanceBenchmarkServiceFn;
  private readonly createRegressionSuiteService: CreateRegressionSuiteServiceFn;
  private readonly createChaosTestingService: CreateChaosTestingServiceFn;
  private readonly createDeterministicReplayValidationService: CreateDeterministicReplayValidationServiceFn;
  private readonly verifyExecutionFn: typeof verifyExecutionReadiness;
  private readonly verifyArchitectureFn: typeof verifyArchitectureReadiness;
  private readonly verifyDiagnosticsFn: typeof verifyDiagnosticsReadiness;
  private readonly verifyConfigurationFn: typeof verifyConfigurationReadiness;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly leaseDurationMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: LiveReadinessReviewEvent[] = [];
  private completedReport: LiveReadinessReport | null = null;
  private lastMetrics: LiveReadinessReviewMetrics | null = null;
  private inFlight = false;

  private constructor(dependencies: LiveReadinessReviewServiceDependencies) {
    this.configuration = dependencies.configuration as LiveReadinessReviewConfiguration;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.createReport = dependencies.createReport ?? createLiveReadinessReport;
    this.createExecutionFactories =
      dependencies.createExecutionServiceFactories ?? createExecutionServiceFactories;
    this.createPerformanceBenchmarkService =
      dependencies.createPerformanceBenchmarkService ??
      (() => this.defaultPerformanceBenchmarkService());
    this.createRegressionSuiteService =
      dependencies.createRegressionSuiteService ?? (() => this.defaultRegressionSuiteService());
    this.createChaosTestingService =
      dependencies.createChaosTestingService ?? (() => this.defaultChaosTestingService());
    this.createDeterministicReplayValidationService =
      dependencies.createDeterministicReplayValidationService ??
      (() => this.defaultDeterministicReplayValidationService());
    this.verifyExecutionFn = dependencies.verifyExecution ?? verifyExecutionReadiness;
    this.verifyArchitectureFn = dependencies.verifyArchitecture ?? verifyArchitectureReadiness;
    this.verifyDiagnosticsFn = dependencies.verifyDiagnostics ?? verifyDiagnosticsReadiness;
    this.verifyConfigurationFn = dependencies.verifyConfiguration ?? verifyConfigurationReadiness;
    this.workspaceId = (dependencies.workspaceId ?? 'live-readiness-review-workspace').trim();
    this.strategyId = (dependencies.strategyId ?? 'live-readiness-review-strategy').trim();
    this.leaseDurationMs = dependencies.leaseDurationMs ?? 60_000;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs ?? 300_000;
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
  }

  static create(dependencies: LiveReadinessReviewServiceDependencies): LiveReadinessReviewService {
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new LiveReadinessReviewValidationError('configuration is required');
    }

    let configuration: LiveReadinessReviewConfiguration;
    try {
      configuration = createLiveReadinessReviewConfiguration(dependencies.configuration);
    } catch (error) {
      throw new LiveReadinessReviewValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    const workspaceId = (dependencies.workspaceId ?? 'live-readiness-review-workspace').trim();
    if (workspaceId === '') {
      throw new LiveReadinessReviewValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? 'live-readiness-review-strategy').trim();
    if (strategyId === '') {
      throw new LiveReadinessReviewValidationError('strategyId is required');
    }

    return new LiveReadinessReviewService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs readiness verification across all configured categories.
   *
   * Idempotent for a completed execution: returns the same final report, or
   * rejects with LiveReadinessReviewAlreadyCompletedError when rejectOnRepeat
   * is set. Concurrent re-entry is rejected.
   */
  async execute(): Promise<LiveReadinessReport> {
    if (this.completedReport !== null) {
      if (this.rejectOnRepeat) {
        throw new LiveReadinessReviewAlreadyCompletedError(this.completedReport.reviewId);
      }
      return this.completedReport;
    }
    if (this.inFlight) {
      throw new LiveReadinessReviewDuplicateExecutionError();
    }

    this.inFlight = true;
    const reviewId = this.configuration.reviewId;
    const startedAt = this.clock();
    const categoryResults: ReadinessCategoryResult[] = [];

    this.emit({
      eventType: 'ReviewStarted',
      reviewId,
      occurredAt: startedAt,
      totalCategories: READINESS_CATEGORIES.length,
    });

    try {
      for (const category of READINESS_CATEGORIES) {
        const categoryResult = await this.verifyCategory(category);
        categoryResults.push(categoryResult);
        this.emitCategoryVerified(reviewId, categoryResult);
      }

      const completedAt = this.clock();
      const report = this.createReport(
        aggregateLiveReadinessReport(reviewId, categoryResults, startedAt, completedAt),
      );

      this.emit({
        eventType: 'ReviewCompleted',
        reviewId,
        occurredAt: completedAt,
        overallStatus: report.overallStatus,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        warnings: report.warnings.length,
        duration: report.duration,
        completedAt,
      });

      this.completedReport = report;
      this.lastMetrics = createLiveReadinessReviewMetrics({
        totalChecks: report.passedChecks + report.failedChecks,
        passed: report.passedChecks,
        failed: report.failedChecks,
        warnings: report.warnings.length,
        reviewDuration: report.duration,
      });

      return report;
    } catch (error) {
      throw this.mapExecutionError(error);
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly LiveReadinessReviewEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): LiveReadinessReviewMetrics | null {
    return this.lastMetrics;
  }

  lastReport(): LiveReadinessReport | null {
    return this.completedReport;
  }

  reviewConfiguration(): LiveReadinessReviewConfiguration {
    return this.configuration;
  }

  private async verifyCategory(category: ReadinessCategory): Promise<ReadinessCategoryResult> {
    switch (category) {
      case 'Execution':
        return this.verifyExecutionFn({
          factories: this.createExecutionFactories(this.scenarioContext()),
        });
      case 'Determinism':
        return this.verifyDeterminismReadiness();
      case 'Performance':
        return this.verifyPerformanceReadiness();
      case 'Regression':
        return this.verifyRegressionReadiness();
      case 'Chaos':
        return this.verifyChaosReadiness();
      case 'Diagnostics':
        return this.verifyDiagnosticsFn({
          clock: this.clock,
          factories: this.createExecutionFactories(this.scenarioContext()),
        });
      case 'Configuration':
        return this.verifyConfigurationFn({ configuration: this.configuration });
      case 'Architecture':
        return this.verifyArchitectureFn();
      default:
        throw new LiveReadinessReviewValidationError(
          `unsupported readiness category: ${String(category)}`,
        );
    }
  }

  private async verifyDeterminismReadiness(): Promise<ReadinessCategoryResult> {
    try {
      const service = this.createDeterministicReplayValidationService();
      const result = await service.execute();
      const passed = result.deterministic && result.failedIterations === 0;
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'determinism-replay-validation',
          description: 'Deterministic replay validation passes',
          passed,
          warning: false,
        }),
      ]);
      const recommendations = generateCategoryRecommendations('Determinism', checks);
      return buildReadinessCategoryResult('Determinism', checks, recommendations);
    } catch (error) {
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'determinism-replay-validation',
          description: 'Deterministic replay validation passes',
          passed: false,
          warning: false,
        }),
      ]);
      const recommendations = [
        ...generateCategoryRecommendations('Determinism', checks),
        error instanceof Error ? error.message : String(error),
      ];
      return buildReadinessCategoryResult('Determinism', checks, recommendations);
    }
  }

  private async verifyPerformanceReadiness(): Promise<ReadinessCategoryResult> {
    try {
      const service = this.createPerformanceBenchmarkService();
      const result = await service.execute();
      const failedBenchmarks = result.benchmarkResults.filter(
        (benchmark) => !benchmark.success,
      ).length;
      const passed = failedBenchmarks === 0;
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'performance-benchmark-suite',
          description: 'Performance benchmark suite passes',
          passed,
          warning: false,
        }),
      ]);
      const recommendations = generateCategoryRecommendations('Performance', checks);
      return buildReadinessCategoryResult('Performance', checks, recommendations);
    } catch (error) {
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'performance-benchmark-suite',
          description: 'Performance benchmark suite passes',
          passed: false,
          warning: false,
        }),
      ]);
      const recommendations = [
        ...generateCategoryRecommendations('Performance', checks),
        error instanceof Error ? error.message : String(error),
      ];
      return buildReadinessCategoryResult('Performance', checks, recommendations);
    }
  }

  private async verifyRegressionReadiness(): Promise<ReadinessCategoryResult> {
    try {
      const service = this.createRegressionSuiteService();
      const result = await service.execute();
      const passed = result.scenariosFailed === 0 && result.regressionsDetected === 0;
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'regression-suite',
          description: 'Regression suite passes',
          passed,
          warning: false,
        }),
      ]);
      const recommendations = generateCategoryRecommendations('Regression', checks);
      return buildReadinessCategoryResult('Regression', checks, recommendations);
    } catch (error) {
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'regression-suite',
          description: 'Regression suite passes',
          passed: false,
          warning: false,
        }),
      ]);
      const recommendations = [
        ...generateCategoryRecommendations('Regression', checks),
        error instanceof Error ? error.message : String(error),
      ];
      return buildReadinessCategoryResult('Regression', checks, recommendations);
    }
  }

  private async verifyChaosReadiness(): Promise<ReadinessCategoryResult> {
    try {
      const service = this.createChaosTestingService();
      const result = await service.execute();
      const passed = result.scenariosFailed === 0;
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'chaos-testing-suite',
          description: 'Chaos testing suite passes',
          passed,
          warning: false,
        }),
      ]);
      const recommendations = generateCategoryRecommendations('Chaos', checks);
      return buildReadinessCategoryResult('Chaos', checks, recommendations);
    } catch (error) {
      const checks = Object.freeze([
        createReadinessCheck({
          checkId: 'chaos-testing-suite',
          description: 'Chaos testing suite passes',
          passed: false,
          warning: false,
        }),
      ]);
      const recommendations = [
        ...generateCategoryRecommendations('Chaos', checks),
        error instanceof Error ? error.message : String(error),
      ];
      return buildReadinessCategoryResult('Chaos', checks, recommendations);
    }
  }

  private defaultPerformanceBenchmarkService(): PerformanceBenchmarkService {
    return PerformanceBenchmarkService.create({
      configuration: this.configuration.benchmarkConfiguration,
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    } satisfies PerformanceBenchmarkServiceDependencies);
  }

  private defaultRegressionSuiteService(): RegressionSuiteService {
    return RegressionSuiteService.create({
      configuration: this.configuration.regressionConfiguration,
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    } satisfies RegressionSuiteServiceDependencies);
  }

  private defaultChaosTestingService(): ChaosTestingService {
    return ChaosTestingService.create({
      configuration: this.configuration.chaosConfiguration,
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });
  }

  private defaultDeterministicReplayValidationService(): DeterministicReplayValidationService {
    const deterministicDependencies = createDeterministicReplayRegressionDependencies({
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });

    return DeterministicReplayValidationService.create({
      dataset: this.configuration.deterministicDataset,
      configuration: this.configuration.deterministicConfiguration,
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
      createSessionId: deterministicDependencies.createSessionId,
      createRuntimeId: deterministicDependencies.createRuntimeId,
    } satisfies DeterministicReplayValidationServiceDependencies);
  }

  private scenarioContext(): BenchmarkScenarioContext {
    return Object.freeze({
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });
  }

  private emitCategoryVerified(reviewId: string, categoryResult: ReadinessCategoryResult): void {
    const checksPassed = categoryResult.checks.filter((check) => check.passed).length;
    const checksFailed = categoryResult.checks.filter(
      (check) => !check.passed && !check.warning,
    ).length;
    const verifiedAt = this.clock();

    this.emit({
      eventType: 'CategoryVerified',
      reviewId,
      occurredAt: verifiedAt,
      category: categoryResult.category,
      status: categoryResult.status,
      checksPassed,
      checksFailed,
      warnings: categoryResult.warnings.length,
      verifiedAt,
    });
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof LiveReadinessReviewError) {
      return error;
    }
    if (error instanceof Error) {
      return new LiveReadinessReviewExecutionFailedError(error.message, error);
    }
    return new LiveReadinessReviewExecutionFailedError(String(error), error);
  }

  private emit(event: LiveReadinessReviewEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}

export type {
  PerformanceBenchmarkServiceDependencies,
  RegressionSuiteServiceDependencies,
  DeterministicReplayValidationServiceDependencies,
};
