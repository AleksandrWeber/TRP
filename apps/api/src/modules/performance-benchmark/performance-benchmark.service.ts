import { randomUUID } from 'node:crypto';
import {
  HistoricalReplayService,
  type HistoricalReplayServiceDependencies,
} from '../historical-replay';
import {
  MultiYearResearchService,
  type MultiYearResearchServiceDependencies,
} from '../multi-year-research';
import { SmokeBacktestService, type SmokeBacktestServiceDependencies } from '../smoke-backtest';
import {
  WalkForwardValidationService,
  type WalkForwardValidationServiceDependencies,
} from '../walk-forward-validation';
import type { BenchmarkEntryConfiguration } from './benchmark-configuration';
import {
  createBenchmarkSuiteConfiguration,
  type BenchmarkSuiteConfiguration,
} from './benchmark-configuration';
import type { PerformanceBenchmarkEvent } from './benchmark-events';
import {
  PerformanceBenchmarkAlreadyCompletedError,
  PerformanceBenchmarkDuplicateExecutionError,
  PerformanceBenchmarkError,
  PerformanceBenchmarkExecutionFailedError,
  PerformanceBenchmarkValidationError,
} from './benchmark-errors';
import {
  calculateThroughput,
  createBenchmarkResult,
  type BenchmarkResult,
} from './benchmark-result';
import type { BenchmarkScenario } from './benchmark-scenario';
import {
  createBenchmarkScenarioFactories,
  type BenchmarkScenarioContext,
  type BenchmarkScenarioFactories,
} from './benchmark-scenarios';
import {
  aggregateBenchmarkSuiteResult,
  createBenchmarkSuiteResult,
  type BenchmarkSuiteResult,
} from './benchmark-suite-result';

export type CreateBenchmarkSuiteResultFn = (
  properties: BenchmarkSuiteResult,
) => BenchmarkSuiteResult;

export type CreateBenchmarkResultFn = (properties: BenchmarkResult) => BenchmarkResult;

export type CreateSmokeBacktestServiceFn = (
  scenario: BenchmarkScenario,
  context: BenchmarkScenarioContext,
) => SmokeBacktestService;

export type CreateHistoricalReplayServiceFn = (
  scenario: BenchmarkScenario,
  context: BenchmarkScenarioContext,
) => HistoricalReplayService;

export type CreateWalkForwardValidationServiceFn = (
  scenario: BenchmarkScenario,
  context: BenchmarkScenarioContext,
) => WalkForwardValidationService;

export type CreateMultiYearResearchServiceFn = (
  scenario: BenchmarkScenario,
  context: BenchmarkScenarioContext,
) => MultiYearResearchService;

export type PerformanceBenchmarkServiceDependencies = Readonly<{
  configuration: BenchmarkSuiteConfiguration | null;
  clock?: () => string;
  createSuiteResult?: CreateBenchmarkSuiteResultFn;
  createBenchmarkResult?: CreateBenchmarkResultFn;
  createScenarioFactories?: (context: BenchmarkScenarioContext) => BenchmarkScenarioFactories;
  createSmokeBacktestService?: CreateSmokeBacktestServiceFn;
  createHistoricalReplayService?: CreateHistoricalReplayServiceFn;
  createWalkForwardValidationService?: CreateWalkForwardValidationServiceFn;
  createMultiYearResearchService?: CreateMultiYearResearchServiceFn;
  workspaceId?: string;
  strategyId?: string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  /**
   * When true, a repeated execute() after completion rejects with
   * PerformanceBenchmarkAlreadyCompletedError instead of returning the
   * cached result.
   */
  rejectOnRepeat?: boolean;
}>;

/**
 * US196 Performance Benchmark application service.
 *
 * Executes predefined research scenarios under controlled conditions and
 * collects execution metrics. Contains no trading logic.
 */
export class PerformanceBenchmarkService {
  private readonly configuration: BenchmarkSuiteConfiguration;
  private readonly clock: () => string;
  private readonly createSuiteResult: CreateBenchmarkSuiteResultFn;
  private readonly createBenchmarkResultFn: CreateBenchmarkResultFn;
  private readonly createScenarioFactories: (
    context: BenchmarkScenarioContext,
  ) => BenchmarkScenarioFactories;
  private readonly customSmokeFactory: CreateSmokeBacktestServiceFn | null;
  private readonly customHistoricalFactory: CreateHistoricalReplayServiceFn | null;
  private readonly customWalkForwardFactory: CreateWalkForwardValidationServiceFn | null;
  private readonly customMultiYearFactory: CreateMultiYearResearchServiceFn | null;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly leaseDurationMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: PerformanceBenchmarkEvent[] = [];
  private completedResult: BenchmarkSuiteResult | null = null;
  private inFlight = false;

  private constructor(dependencies: PerformanceBenchmarkServiceDependencies) {
    this.configuration = dependencies.configuration as BenchmarkSuiteConfiguration;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.createSuiteResult = dependencies.createSuiteResult ?? createBenchmarkSuiteResult;
    this.createBenchmarkResultFn = dependencies.createBenchmarkResult ?? createBenchmarkResult;
    this.createScenarioFactories =
      dependencies.createScenarioFactories ??
      ((context) => createBenchmarkScenarioFactories(context));
    this.customSmokeFactory = dependencies.createSmokeBacktestService ?? null;
    this.customHistoricalFactory = dependencies.createHistoricalReplayService ?? null;
    this.customWalkForwardFactory = dependencies.createWalkForwardValidationService ?? null;
    this.customMultiYearFactory = dependencies.createMultiYearResearchService ?? null;
    this.workspaceId = (dependencies.workspaceId ?? 'performance-benchmark-workspace').trim();
    this.strategyId = (dependencies.strategyId ?? 'performance-benchmark-strategy').trim();
    this.leaseDurationMs = dependencies.leaseDurationMs ?? 60_000;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs ?? 300_000;
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
  }

  static create(
    dependencies: PerformanceBenchmarkServiceDependencies,
  ): PerformanceBenchmarkService {
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new PerformanceBenchmarkValidationError('configuration is required');
    }

    let configuration: BenchmarkSuiteConfiguration;
    try {
      configuration = createBenchmarkSuiteConfiguration(dependencies.configuration);
    } catch (error) {
      throw new PerformanceBenchmarkValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    const workspaceId = (dependencies.workspaceId ?? 'performance-benchmark-workspace').trim();
    if (workspaceId === '') {
      throw new PerformanceBenchmarkValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? 'performance-benchmark-strategy').trim();
    if (strategyId === '') {
      throw new PerformanceBenchmarkValidationError('strategyId is required');
    }

    return new PerformanceBenchmarkService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs each configured benchmark scenario in deterministic order.
   *
   * Idempotent for a completed execution: returns the same final result, or
   * rejects with PerformanceBenchmarkAlreadyCompletedError when rejectOnRepeat
   * is set. Concurrent re-entry is rejected.
   */
  async execute(): Promise<BenchmarkSuiteResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new PerformanceBenchmarkAlreadyCompletedError(this.completedResult.suiteId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new PerformanceBenchmarkDuplicateExecutionError();
    }

    this.inFlight = true;
    const suiteId = this.configuration.suiteId;
    const benchmarkResults: BenchmarkResult[] = [];
    let succeededBenchmarks = 0;
    let failedBenchmarks = 0;

    try {
      for (const entry of this.configuration.benchmarks) {
        const result = await this.executeBenchmark(entry);
        benchmarkResults.push(result);
        if (result.success) {
          succeededBenchmarks += 1;
        } else {
          failedBenchmarks += 1;
        }
      }

      const aggregated = aggregateBenchmarkSuiteResult(suiteId, benchmarkResults);
      const completedAt = this.clock();

      this.emit({
        eventType: 'SuiteCompleted',
        suiteId,
        occurredAt: completedAt,
        totalBenchmarks: benchmarkResults.length,
        succeededBenchmarks,
        failedBenchmarks,
        totalDuration: aggregated.totalDuration,
        completedAt,
      });

      const suiteResult = this.createSuiteResult(aggregated);
      this.completedResult = suiteResult;
      return suiteResult;
    } catch (error) {
      throw this.mapExecutionError(error);
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly PerformanceBenchmarkEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  lastResult(): BenchmarkSuiteResult | null {
    return this.completedResult;
  }

  suiteConfiguration(): BenchmarkSuiteConfiguration {
    return this.configuration;
  }

  private async executeBenchmark(entry: BenchmarkEntryConfiguration): Promise<BenchmarkResult> {
    const startedAt = this.clock();
    const context = this.scenarioContext();

    this.emit({
      eventType: 'BenchmarkStarted',
      suiteId: this.configuration.suiteId,
      occurredAt: startedAt,
      benchmarkId: entry.benchmarkId,
      scenario: entry.scenario,
    });

    try {
      const result = await this.runScenario(entry, context, startedAt);
      const completedAt = this.clock();

      this.emit({
        eventType: 'BenchmarkCompleted',
        suiteId: this.configuration.suiteId,
        occurredAt: completedAt,
        benchmarkId: entry.benchmarkId,
        scenario: entry.scenario,
        duration: result.duration,
        candlesProcessed: result.candlesProcessed,
        cyclesProcessed: result.cyclesProcessed,
        completedAt,
      });

      return result;
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const duration = Math.max(0, Date.parse(failedAt) - Date.parse(startedAt));

      this.emit({
        eventType: 'BenchmarkFailed',
        suiteId: this.configuration.suiteId,
        occurredAt: failedAt,
        benchmarkId: entry.benchmarkId,
        scenario: entry.scenario,
        reason: mapped.message,
        failedAt,
      });

      return this.createBenchmarkResultFn({
        benchmarkId: entry.benchmarkId,
        scenario: entry.scenario,
        startedAt,
        completedAt: failedAt,
        duration,
        datasetsProcessed: 0,
        windowsProcessed: 0,
        candlesProcessed: 0,
        cyclesProcessed: 0,
        throughputCandlesPerSecond: 0,
        throughputCyclesPerSecond: 0,
        success: false,
      });
    }
  }

  private async runScenario(
    entry: BenchmarkEntryConfiguration,
    context: BenchmarkScenarioContext,
    startedAt: string,
  ): Promise<BenchmarkResult> {
    const factories = this.resolveScenarioFactories(context);

    switch (entry.scenario) {
      case 'Smoke': {
        const service = factories.createSmokeBacktestService();
        const execution = await service.execute();
        const completedAt = this.clock();
        const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
        return this.buildBenchmarkResult({
          benchmarkId: entry.benchmarkId,
          scenario: entry.scenario,
          startedAt,
          completedAt,
          duration,
          datasetsProcessed: 0,
          windowsProcessed: 0,
          candlesProcessed: execution.candlesProcessed,
          cyclesProcessed: execution.cyclesExecuted,
          success: true,
        });
      }
      case 'HistoricalReplay': {
        const service = factories.createHistoricalReplayService();
        const execution = await service.execute();
        const completedAt = this.clock();
        const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
        return this.buildBenchmarkResult({
          benchmarkId: entry.benchmarkId,
          scenario: entry.scenario,
          startedAt,
          completedAt,
          duration,
          datasetsProcessed: 1,
          windowsProcessed: 0,
          candlesProcessed: execution.candlesProcessed,
          cyclesProcessed: execution.cyclesExecuted,
          success: true,
        });
      }
      case 'WalkForward': {
        const service = factories.createWalkForwardValidationService();
        const execution = await service.execute();
        const completedAt = this.clock();
        const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
        const candlesProcessed = execution.replayResults.reduce(
          (total, replay) => total + replay.candlesProcessed,
          0,
        );
        const cyclesProcessed = execution.replayResults.reduce(
          (total, replay) => total + replay.cyclesExecuted,
          0,
        );
        return this.buildBenchmarkResult({
          benchmarkId: entry.benchmarkId,
          scenario: entry.scenario,
          startedAt,
          completedAt,
          duration,
          datasetsProcessed: 1,
          windowsProcessed: execution.completedWindows,
          candlesProcessed,
          cyclesProcessed,
          success: true,
        });
      }
      case 'MultiYearResearch': {
        const service = factories.createMultiYearResearchService();
        const execution = await service.execute();
        const completedAt = this.clock();
        const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
        const windowsProcessed = execution.walkForwardResults.reduce(
          (total, walkForward) => total + walkForward.completedWindows,
          0,
        );
        const candlesProcessed = execution.walkForwardResults.reduce(
          (total, walkForward) =>
            total +
            walkForward.replayResults.reduce(
              (windowTotal, replay) => windowTotal + replay.candlesProcessed,
              0,
            ),
          0,
        );
        const cyclesProcessed = execution.walkForwardResults.reduce(
          (total, walkForward) =>
            total +
            walkForward.replayResults.reduce(
              (windowTotal, replay) => windowTotal + replay.cyclesExecuted,
              0,
            ),
          0,
        );
        return this.buildBenchmarkResult({
          benchmarkId: entry.benchmarkId,
          scenario: entry.scenario,
          startedAt,
          completedAt,
          duration,
          datasetsProcessed: execution.datasetsProcessed,
          windowsProcessed,
          candlesProcessed,
          cyclesProcessed,
          success: true,
        });
      }
      default:
        throw new PerformanceBenchmarkValidationError(
          `unsupported scenario: ${String(entry.scenario)}`,
        );
    }
  }

  private buildBenchmarkResult(properties: {
    benchmarkId: string;
    scenario: BenchmarkScenario;
    startedAt: string;
    completedAt: string;
    duration: number;
    datasetsProcessed: number;
    windowsProcessed: number;
    candlesProcessed: number;
    cyclesProcessed: number;
    success: boolean;
  }): BenchmarkResult {
    return this.createBenchmarkResultFn({
      benchmarkId: properties.benchmarkId,
      scenario: properties.scenario,
      startedAt: properties.startedAt,
      completedAt: properties.completedAt,
      duration: properties.duration,
      datasetsProcessed: properties.datasetsProcessed,
      windowsProcessed: properties.windowsProcessed,
      candlesProcessed: properties.candlesProcessed,
      cyclesProcessed: properties.cyclesProcessed,
      throughputCandlesPerSecond: calculateThroughput(
        properties.candlesProcessed,
        properties.duration,
      ),
      throughputCyclesPerSecond: calculateThroughput(
        properties.cyclesProcessed,
        properties.duration,
      ),
      success: properties.success,
    });
  }

  private resolveScenarioFactories(context: BenchmarkScenarioContext): BenchmarkScenarioFactories {
    const defaults = this.createScenarioFactories(context);
    return Object.freeze({
      createSmokeBacktestService:
        this.customSmokeFactory === null
          ? defaults.createSmokeBacktestService
          : () => this.customSmokeFactory!('Smoke', context),
      createHistoricalReplayService:
        this.customHistoricalFactory === null
          ? defaults.createHistoricalReplayService
          : () => this.customHistoricalFactory!('HistoricalReplay', context),
      createWalkForwardValidationService:
        this.customWalkForwardFactory === null
          ? defaults.createWalkForwardValidationService
          : () => this.customWalkForwardFactory!('WalkForward', context),
      createMultiYearResearchService:
        this.customMultiYearFactory === null
          ? defaults.createMultiYearResearchService
          : () => this.customMultiYearFactory!('MultiYearResearch', context),
    });
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

  private mapExecutionError(error: unknown): Error {
    if (error instanceof PerformanceBenchmarkError) {
      return error;
    }
    if (error instanceof Error) {
      return new PerformanceBenchmarkExecutionFailedError(error.message, error);
    }
    return new PerformanceBenchmarkExecutionFailedError(String(error), error);
  }

  private emit(event: PerformanceBenchmarkEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}

export function createDefaultBenchmarkExecutionId(): string {
  return randomUUID();
}

export type {
  SmokeBacktestServiceDependencies,
  HistoricalReplayServiceDependencies,
  WalkForwardValidationServiceDependencies,
  MultiYearResearchServiceDependencies,
};
