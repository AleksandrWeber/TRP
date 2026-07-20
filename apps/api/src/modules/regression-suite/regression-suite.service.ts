import {
  DeterministicReplayValidationService,
  type DeterministicReplayValidationServiceDependencies,
} from '../deterministic-replay-validation';
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
import {
  ExecutionBaselineComparator,
  executionBaselineComparator,
  type ExecutionBaseline,
} from './execution-baseline-comparator';
import {
  createRegressionSuiteConfiguration,
  type RegressionSuiteConfiguration,
} from './regression-suite-configuration';
import type { RegressionSuiteEvent } from './regression-suite-events';
import {
  RegressionSuiteAlreadyCompletedError,
  RegressionSuiteDuplicateExecutionError,
  RegressionSuiteError,
  RegressionSuiteExecutionFailedError,
  RegressionSuiteRegressionDetectedError,
  RegressionSuiteValidationError,
} from './regression-suite-errors';
import {
  createRegressionSuiteMetrics,
  type RegressionSuiteMetrics,
} from './regression-suite-metrics';
import {
  createRegressionScenarioResult,
  type RegressionScenarioResult,
} from './regression-scenario-result';
import type { RegressionScenario } from './regression-scenario';
import {
  aggregateRegressionSuiteResult,
  createRegressionSuiteResult,
  type RegressionSuiteResult,
} from './regression-suite-result';
import {
  captureRegressionBaseline,
  createRegressionScenarioFactories,
  type RegressionScenarioContext,
  type RegressionScenarioFactories,
} from './regression-scenarios';

export type CreateRegressionSuiteResultFn = (
  properties: RegressionSuiteResult,
) => RegressionSuiteResult;

export type CreateRegressionScenarioResultFn = (
  properties: RegressionScenarioResult,
) => RegressionScenarioResult;

export type CreateSmokeBacktestServiceFn = () => SmokeBacktestService;
export type CreateHistoricalReplayServiceFn = () => HistoricalReplayService;
export type CreateWalkForwardValidationServiceFn = () => WalkForwardValidationService;
export type CreateMultiYearResearchServiceFn = () => MultiYearResearchService;
export type CreateDeterministicReplayValidationServiceFn =
  () => DeterministicReplayValidationService;

export type RegressionSuiteServiceDependencies = Readonly<{
  configuration: RegressionSuiteConfiguration | null;
  clock?: () => string;
  comparator?: ExecutionBaselineComparator;
  createSuiteResult?: CreateRegressionSuiteResultFn;
  createScenarioResult?: CreateRegressionScenarioResultFn;
  createScenarioFactories?: (context: RegressionScenarioContext) => RegressionScenarioFactories;
  createSmokeBacktestService?: CreateSmokeBacktestServiceFn;
  createHistoricalReplayService?: CreateHistoricalReplayServiceFn;
  createWalkForwardValidationService?: CreateWalkForwardValidationServiceFn;
  createMultiYearResearchService?: CreateMultiYearResearchServiceFn;
  createDeterministicReplayValidationService?: CreateDeterministicReplayValidationServiceFn;
  captureBaseline?: typeof captureRegressionBaseline;
  workspaceId?: string;
  strategyId?: string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  /**
   * When true, a repeated execute() after completion rejects with
   * RegressionSuiteAlreadyCompletedError instead of returning the cached result.
   */
  rejectOnRepeat?: boolean;
}>;

/**
 * US198 Regression Suite application service.
 *
 * Executes predefined regression scenarios using existing execution services,
 * compares outputs against expected baselines, and aggregates results.
 * Contains no business logic.
 */
export class RegressionSuiteService {
  private readonly configuration: RegressionSuiteConfiguration;
  private readonly clock: () => string;
  private readonly comparator: ExecutionBaselineComparator;
  private readonly createSuiteResult: CreateRegressionSuiteResultFn;
  private readonly createScenarioResultFn: CreateRegressionScenarioResultFn;
  private readonly createScenarioFactories: (
    context: RegressionScenarioContext,
  ) => RegressionScenarioFactories;
  private readonly customSmokeFactory: CreateSmokeBacktestServiceFn | null;
  private readonly customHistoricalFactory: CreateHistoricalReplayServiceFn | null;
  private readonly customWalkForwardFactory: CreateWalkForwardValidationServiceFn | null;
  private readonly customMultiYearFactory: CreateMultiYearResearchServiceFn | null;
  private readonly customDeterministicFactory: CreateDeterministicReplayValidationServiceFn | null;
  private readonly captureBaseline: typeof captureRegressionBaseline;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly leaseDurationMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: RegressionSuiteEvent[] = [];
  private completedResult: RegressionSuiteResult | null = null;
  private lastMetrics: RegressionSuiteMetrics | null = null;
  private inFlight = false;

  private constructor(dependencies: RegressionSuiteServiceDependencies) {
    this.configuration = dependencies.configuration as RegressionSuiteConfiguration;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.comparator = dependencies.comparator ?? executionBaselineComparator;
    this.createSuiteResult = dependencies.createSuiteResult ?? createRegressionSuiteResult;
    this.createScenarioResultFn =
      dependencies.createScenarioResult ?? createRegressionScenarioResult;
    this.createScenarioFactories =
      dependencies.createScenarioFactories ??
      ((context) => createRegressionScenarioFactories(context));
    this.customSmokeFactory = dependencies.createSmokeBacktestService ?? null;
    this.customHistoricalFactory = dependencies.createHistoricalReplayService ?? null;
    this.customWalkForwardFactory = dependencies.createWalkForwardValidationService ?? null;
    this.customMultiYearFactory = dependencies.createMultiYearResearchService ?? null;
    this.customDeterministicFactory =
      dependencies.createDeterministicReplayValidationService ?? null;
    this.captureBaseline = dependencies.captureBaseline ?? captureRegressionBaseline;
    this.workspaceId = (dependencies.workspaceId ?? 'regression-suite-workspace').trim();
    this.strategyId = (dependencies.strategyId ?? 'regression-suite-strategy').trim();
    this.leaseDurationMs = dependencies.leaseDurationMs ?? 60_000;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs ?? 300_000;
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
  }

  static create(dependencies: RegressionSuiteServiceDependencies): RegressionSuiteService {
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new RegressionSuiteValidationError('configuration is required');
    }

    let configuration: RegressionSuiteConfiguration;
    try {
      configuration = createRegressionSuiteConfiguration(dependencies.configuration);
    } catch (error) {
      throw new RegressionSuiteValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    const workspaceId = (dependencies.workspaceId ?? 'regression-suite-workspace').trim();
    if (workspaceId === '') {
      throw new RegressionSuiteValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? 'regression-suite-strategy').trim();
    if (strategyId === '') {
      throw new RegressionSuiteValidationError('strategyId is required');
    }

    return new RegressionSuiteService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs each configured regression scenario in deterministic order.
   *
   * Idempotent for a completed execution: returns the same final result, or
   * rejects with RegressionSuiteAlreadyCompletedError when rejectOnRepeat is
   * set. Concurrent re-entry is rejected.
   */
  async execute(): Promise<RegressionSuiteResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new RegressionSuiteAlreadyCompletedError(this.completedResult.suiteId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new RegressionSuiteDuplicateExecutionError();
    }

    this.inFlight = true;
    const suiteId = this.configuration.suiteId;
    const startedAt = this.clock();
    const scenarioResults: RegressionScenarioResult[] = [];

    this.emit({
      eventType: 'RegressionSuiteStarted',
      suiteId,
      occurredAt: startedAt,
      totalScenarios: this.configuration.scenarios.length,
    });

    try {
      for (const scenario of this.configuration.scenarios) {
        const scenarioResult = await this.executeScenario(scenario);
        scenarioResults.push(scenarioResult);

        if (!scenarioResult.passed && this.configuration.failFast) {
          break;
        }
      }

      const completedAt = this.clock();
      const suiteResult = this.createSuiteResult(
        aggregateRegressionSuiteResult(suiteId, scenarioResults, startedAt, completedAt),
      );

      this.emit({
        eventType: 'RegressionSuiteCompleted',
        suiteId,
        occurredAt: completedAt,
        scenariosExecuted: suiteResult.scenariosExecuted,
        scenariosPassed: suiteResult.scenariosPassed,
        scenariosFailed: suiteResult.scenariosFailed,
        regressionsDetected: suiteResult.regressionsDetected,
        duration: suiteResult.duration,
        completedAt,
      });

      this.completedResult = suiteResult;
      this.lastMetrics = createRegressionSuiteMetrics({
        scenariosExecuted: suiteResult.scenariosExecuted,
        scenariosPassed: suiteResult.scenariosPassed,
        scenariosFailed: suiteResult.scenariosFailed,
        regressionsDetected: suiteResult.regressionsDetected,
        executionDuration: suiteResult.duration,
      });

      if (this.configuration.rejectOnRegression && suiteResult.regressionsDetected > 0) {
        throw new RegressionSuiteRegressionDetectedError(suiteId, suiteResult.regressionsDetected);
      }

      return suiteResult;
    } catch (error) {
      throw this.mapExecutionError(error);
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly RegressionSuiteEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): RegressionSuiteMetrics | null {
    return this.lastMetrics;
  }

  lastResult(): RegressionSuiteResult | null {
    return this.completedResult;
  }

  suiteConfiguration(): RegressionSuiteConfiguration {
    return this.configuration;
  }

  private async executeScenario(scenario: RegressionScenario): Promise<RegressionScenarioResult> {
    const startedAt = this.clock();

    try {
      const actual = await this.captureBaseline(
        scenario.scenarioType,
        this.scenarioContext(),
        this.resolveScenarioFactories(),
      );
      const expected: ExecutionBaseline = Object.freeze({
        result: scenario.expectedResult,
        events: scenario.expectedEvents,
        metrics: scenario.expectedMetrics,
      });
      const mismatches = this.comparator.compare({
        scenarioId: scenario.scenarioId,
        expected,
        actual,
      });
      const completedAt = this.clock();
      const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
      const passed = mismatches.length === 0;
      const regressionDetected = !passed;

      if (regressionDetected) {
        this.emit({
          eventType: 'RegressionDetected',
          suiteId: this.configuration.suiteId,
          occurredAt: completedAt,
          scenarioId: scenario.scenarioId,
          mismatchCount: mismatches.length,
          detectedAt: completedAt,
        });
        this.emit({
          eventType: 'ScenarioFailed',
          suiteId: this.configuration.suiteId,
          occurredAt: completedAt,
          scenarioId: scenario.scenarioId,
          reason: `${mismatches.length} baseline mismatch(es) detected`,
          failedAt: completedAt,
        });
      } else {
        this.emit({
          eventType: 'ScenarioPassed',
          suiteId: this.configuration.suiteId,
          occurredAt: completedAt,
          scenarioId: scenario.scenarioId,
          duration,
          completedAt,
        });
      }

      return this.createScenarioResultFn({
        scenarioId: scenario.scenarioId,
        scenarioType: scenario.scenarioType,
        passed,
        regressionDetected,
        mismatches,
        startedAt,
        completedAt,
        duration,
      });
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const duration = Math.max(0, Date.parse(failedAt) - Date.parse(startedAt));

      this.emit({
        eventType: 'ScenarioFailed',
        suiteId: this.configuration.suiteId,
        occurredAt: failedAt,
        scenarioId: scenario.scenarioId,
        reason: mapped.message,
        failedAt,
      });

      return this.createScenarioResultFn({
        scenarioId: scenario.scenarioId,
        scenarioType: scenario.scenarioType,
        passed: false,
        regressionDetected: false,
        mismatches: Object.freeze([]),
        startedAt,
        completedAt: failedAt,
        duration,
      });
    }
  }

  private scenarioContext(): RegressionScenarioContext {
    return Object.freeze({
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });
  }

  private resolveScenarioFactories(): RegressionScenarioFactories {
    const context = Object.freeze({
      clock: this.clock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });
    const defaults = this.createScenarioFactories(context);

    return Object.freeze({
      createSmokeBacktestService: this.customSmokeFactory ?? defaults.createSmokeBacktestService,
      createHistoricalReplayService:
        this.customHistoricalFactory ?? defaults.createHistoricalReplayService,
      createWalkForwardValidationService:
        this.customWalkForwardFactory ?? defaults.createWalkForwardValidationService,
      createMultiYearResearchService:
        this.customMultiYearFactory ?? defaults.createMultiYearResearchService,
      createDeterministicReplayValidationService:
        this.customDeterministicFactory ?? defaults.createDeterministicReplayValidationService,
    });
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof RegressionSuiteError) {
      return error;
    }
    if (error instanceof Error) {
      return new RegressionSuiteExecutionFailedError(error.message, error);
    }
    return new RegressionSuiteExecutionFailedError(String(error), error);
  }

  private emit(event: RegressionSuiteEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}

export type {
  SmokeBacktestServiceDependencies,
  HistoricalReplayServiceDependencies,
  WalkForwardValidationServiceDependencies,
  MultiYearResearchServiceDependencies,
  DeterministicReplayValidationServiceDependencies,
};
