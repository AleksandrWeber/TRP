import {
  createChaosTestingConfiguration,
  type ChaosTestingConfiguration,
} from './chaos-testing-configuration';
import type { ChaosTestingEvent } from './chaos-testing-events';
import {
  ChaosTestingAlreadyCompletedError,
  ChaosTestingDuplicateExecutionError,
  ChaosTestingError,
  ChaosTestingExecutionFailedError,
  ChaosTestingScenarioFailedError,
  ChaosTestingValidationError,
} from './chaos-testing-errors';
import { createChaosTestingMetrics, type ChaosTestingMetrics } from './chaos-testing-metrics';
import {
  aggregateChaosTestingSuiteResult,
  createChaosTestResult,
  createChaosTestingSuiteResult,
  type ChaosTestResult,
  type ChaosTestingSuiteResult,
} from './chaos-test-result';
import type { ChaosScenario } from './chaos-scenario';
import {
  createChaosScenarioFactories,
  createRecoveryScenarioContext,
  type ChaosServiceFactories,
} from './chaos-scenarios';
import {
  extractErrorCode,
  FailureInjector,
  failureInjector,
  verifyCompletedExecutionPreserved,
  verifyEventEmissionInfrastructureFailure,
  verifyExecutionCleanup,
  verifyExecutionEvents,
  type ChaosScenarioContext,
  type FailureInjectionResult,
} from './failure-injector';

export type CreateChaosTestingSuiteResultFn = (
  properties: ChaosTestingSuiteResult,
) => ChaosTestingSuiteResult;

export type CreateChaosTestResultFn = (properties: ChaosTestResult) => ChaosTestResult;

export type ChaosTestingServiceDependencies = Readonly<{
  configuration: ChaosTestingConfiguration | null;
  clock?: () => string;
  failureInjector?: FailureInjector;
  createSuiteResult?: CreateChaosTestingSuiteResultFn;
  createTestResult?: CreateChaosTestResultFn;
  createScenarioFactories?: (context: ChaosScenarioContext) => ChaosServiceFactories;
  workspaceId?: string;
  strategyId?: string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  /**
   * When true, a repeated execute() after completion rejects with
   * ChaosTestingAlreadyCompletedError instead of returning the cached result.
   */
  rejectOnRepeat?: boolean;
}>;

/**
 * US199 Chaos Testing application service.
 *
 * Executes predefined chaos scenarios using existing execution services,
 * injects deterministic failures through test doubles, verifies error
 * propagation and recovery, and aggregates results. Contains no trading logic.
 */
export class ChaosTestingService {
  private readonly configuration: ChaosTestingConfiguration;
  private readonly clock: () => string;
  private readonly injector: FailureInjector;
  private readonly createSuiteResult: CreateChaosTestingSuiteResultFn;
  private readonly createTestResultFn: CreateChaosTestResultFn;
  private readonly createScenarioFactories: (
    context: ChaosScenarioContext,
  ) => ChaosServiceFactories;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly leaseDurationMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: ChaosTestingEvent[] = [];
  private completedResult: ChaosTestingSuiteResult | null = null;
  private lastMetrics: ChaosTestingMetrics | null = null;
  private inFlight = false;

  private constructor(dependencies: ChaosTestingServiceDependencies) {
    this.configuration = dependencies.configuration as ChaosTestingConfiguration;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.injector = dependencies.failureInjector ?? failureInjector;
    this.createSuiteResult = dependencies.createSuiteResult ?? createChaosTestingSuiteResult;
    this.createTestResultFn = dependencies.createTestResult ?? createChaosTestResult;
    this.createScenarioFactories =
      dependencies.createScenarioFactories ?? createChaosScenarioFactories;
    this.workspaceId = (dependencies.workspaceId ?? 'chaos-testing-workspace').trim();
    this.strategyId = (dependencies.strategyId ?? 'chaos-testing-strategy').trim();
    this.leaseDurationMs = dependencies.leaseDurationMs ?? 60_000;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs ?? 300_000;
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
  }

  static create(dependencies: ChaosTestingServiceDependencies): ChaosTestingService {
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new ChaosTestingValidationError('configuration is required');
    }

    let configuration: ChaosTestingConfiguration;
    try {
      configuration = createChaosTestingConfiguration(dependencies.configuration);
    } catch (error) {
      throw new ChaosTestingValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    const workspaceId = (dependencies.workspaceId ?? 'chaos-testing-workspace').trim();
    if (workspaceId === '') {
      throw new ChaosTestingValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? 'chaos-testing-strategy').trim();
    if (strategyId === '') {
      throw new ChaosTestingValidationError('strategyId is required');
    }

    return new ChaosTestingService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs each configured chaos scenario in deterministic order.
   *
   * Idempotent for a completed execution: returns the same final result, or
   * rejects with ChaosTestingAlreadyCompletedError when rejectOnRepeat is set.
   */
  async execute(): Promise<ChaosTestingSuiteResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new ChaosTestingAlreadyCompletedError(this.completedResult.suiteId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new ChaosTestingDuplicateExecutionError();
    }

    this.inFlight = true;
    const suiteId = this.configuration.suiteId;
    const startedAt = this.clock();
    const scenarioResults: ChaosTestResult[] = [];

    this.emit({
      eventType: 'ChaosTestingStarted',
      suiteId,
      occurredAt: startedAt,
      totalScenarios: this.configuration.scenarios.length,
    });

    try {
      for (const scenario of this.configuration.scenarios) {
        const scenarioResult = await this.executeScenario(scenario);
        scenarioResults.push(scenarioResult);

        if (!scenarioResult.success && this.configuration.failFast) {
          break;
        }
      }

      const completedAt = this.clock();
      const suiteResult = this.createSuiteResult(
        aggregateChaosTestingSuiteResult(suiteId, scenarioResults, startedAt, completedAt),
      );

      this.emit({
        eventType: 'ChaosTestingCompleted',
        suiteId,
        occurredAt: completedAt,
        scenariosExecuted: suiteResult.scenariosExecuted,
        scenariosPassed: suiteResult.scenariosPassed,
        scenariosFailed: suiteResult.scenariosFailed,
        duration: suiteResult.duration,
        completedAt,
      });

      this.completedResult = suiteResult;
      this.lastMetrics = createChaosTestingMetrics({
        scenariosExecuted: suiteResult.scenariosExecuted,
        scenariosPassed: suiteResult.scenariosPassed,
        scenariosFailed: suiteResult.scenariosFailed,
        executionDuration: suiteResult.duration,
      });

      if (this.configuration.rejectOnScenarioFailure && suiteResult.scenariosFailed > 0) {
        throw new ChaosTestingScenarioFailedError(suiteId, suiteResult.scenariosFailed);
      }

      return suiteResult;
    } catch (error) {
      throw this.mapExecutionError(error);
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly ChaosTestingEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): ChaosTestingMetrics | null {
    return this.lastMetrics;
  }

  lastResult(): ChaosTestingSuiteResult | null {
    return this.completedResult;
  }

  suiteConfiguration(): ChaosTestingConfiguration {
    return this.configuration;
  }

  private async executeScenario(scenario: ChaosScenario): Promise<ChaosTestResult> {
    const suiteId = this.configuration.suiteId;
    const scenarioStartedAt = this.clock();

    this.emit({
      eventType: 'ChaosScenarioStarted',
      suiteId,
      occurredAt: scenarioStartedAt,
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      injectedFailure: scenario.injectedFailure,
    });

    try {
      return await this.runScenario(scenario, suiteId);
    } catch (_error) {
      const completedAt = this.clock();
      this.emit({
        eventType: 'FailureInjected',
        suiteId,
        occurredAt: completedAt,
        scenarioId: scenario.scenarioId,
        injectedFailure: scenario.injectedFailure,
        observedFailure: 'SCENARIO_EXECUTION_FAILED',
      });
      this.emit({
        eventType: 'RecoveryVerified',
        suiteId,
        occurredAt: completedAt,
        scenarioId: scenario.scenarioId,
        recoverySucceeded: false,
      });
      this.emit({
        eventType: 'ChaosScenarioCompleted',
        suiteId,
        occurredAt: completedAt,
        scenarioId: scenario.scenarioId,
        success: false,
        eventsVerified: false,
        cleanupVerified: false,
        completedAt,
      });

      return this.createTestResultFn({
        scenarioId: scenario.scenarioId,
        injectedFailure: scenario.injectedFailure,
        expectedFailure: scenario.expectedFailure,
        observedFailure: 'SCENARIO_EXECUTION_FAILED',
        recoverySucceeded: false,
        eventsVerified: false,
        cleanupVerified: false,
        success: false,
      });
    }
  }

  private async runScenario(scenario: ChaosScenario, suiteId: string): Promise<ChaosTestResult> {
    const scenarioContext = this.scenarioContext(scenario);
    const recoveryContext = createRecoveryScenarioContext({
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });

    const injection = this.injector.inject(scenario, scenarioContext);
    const failingFactories = this.createScenarioFactories(scenarioContext);
    const failingService = this.injector.createService(scenario, failingFactories, injection);

    let observedFailure: string | null = null;
    let executionSucceeded = false;
    try {
      await failingService.execute();
      executionSucceeded = true;
    } catch (error) {
      observedFailure = extractErrorCode(error);
    }

    this.emit({
      eventType: 'FailureInjected',
      suiteId,
      occurredAt: this.clock(),
      scenarioId: scenario.scenarioId,
      injectedFailure: scenario.injectedFailure,
      observedFailure: observedFailure ?? 'NONE',
    });

    const eventsVerified =
      scenario.injectedFailure === 'EventEmissionFailure'
        ? verifyEventEmissionInfrastructureFailure(failingService) &&
          verifyCompletedExecutionPreserved(failingService)
        : verifyExecutionEvents(failingService, scenario.expectedFailedEventType);
    const cleanupVerified = verifyExecutionCleanup(failingService, scenario.injectedFailure);

    const recoveryFactories = this.createScenarioFactories(recoveryContext);
    const recoveryService = this.injector.createService(scenario, recoveryFactories, {
      serviceOverrides: Object.freeze({}),
    });

    let recoverySucceeded = false;
    try {
      await recoveryService.execute();
      recoverySucceeded = true;
    } catch {
      recoverySucceeded = false;
    }

    this.emit({
      eventType: 'RecoveryVerified',
      suiteId,
      occurredAt: this.clock(),
      scenarioId: scenario.scenarioId,
      recoverySucceeded,
    });

    const success =
      scenario.injectedFailure === 'EventEmissionFailure'
        ? executionSucceeded &&
          observedFailure === null &&
          eventsVerified &&
          cleanupVerified &&
          recoverySucceeded
        : observedFailure === scenario.expectedFailure &&
          eventsVerified &&
          cleanupVerified &&
          recoverySucceeded;

    const completedAt = this.clock();
    this.emit({
      eventType: 'ChaosScenarioCompleted',
      suiteId,
      occurredAt: completedAt,
      scenarioId: scenario.scenarioId,
      success,
      eventsVerified,
      cleanupVerified,
      completedAt,
    });

    return this.createTestResultFn({
      scenarioId: scenario.scenarioId,
      injectedFailure: scenario.injectedFailure,
      expectedFailure: scenario.expectedFailure,
      observedFailure,
      recoverySucceeded,
      eventsVerified,
      cleanupVerified,
      success,
    });
  }

  private scenarioContext(scenario: ChaosScenario): ChaosScenarioContext {
    const injectionClock =
      scenario.clockTimes !== undefined && scenario.clockTimes.length > 0
        ? createScenarioClock(scenario.clockTimes)
        : this.clock;

    return Object.freeze({
      clock: injectionClock,
      workspaceId: this.workspaceId,
      strategyId: this.strategyId,
      leaseDurationMs: scenario.leaseDurationMs ?? this.leaseDurationMs,
      heartbeatTimeoutMs: scenario.heartbeatTimeoutMs ?? this.heartbeatTimeoutMs,
    });
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof ChaosTestingError) {
      return error;
    }
    if (error instanceof Error) {
      return new ChaosTestingExecutionFailedError(error.message, error);
    }
    return new ChaosTestingExecutionFailedError(String(error), error);
  }

  private emit(event: ChaosTestingEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}

function createScenarioClock(times: readonly string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

export type { FailureInjectionResult };
