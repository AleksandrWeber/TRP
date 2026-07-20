import {
  createReplayConfiguration,
  HistoricalMarketDataProvider,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  HistoricalReplayValidationError,
  type HistoricalDataset,
  type HistoricalReplayEvent,
  type HistoricalReplayServiceDependencies,
} from '../historical-replay';
import {
  createApplicationEventNotificationState,
  type ApplicationEventNotifier,
  type EventEmissionDiagnostic,
} from '../research-api';
import type { PaperStrategy } from '../paper-trading-runner';
import {
  createExecutionResult,
  ExecutionStatus,
  InMemorySmokeSessionRepository,
  type ExecutionResult,
} from '../smoke-backtest';
import { RunnerStatus } from '../paper-trading-runner';
import { compareReplayToBaseline } from './compare-replays';
import {
  createDeterministicReplayConfiguration,
  type DeterministicReplayConfiguration,
} from './deterministic-replay-validation-configuration';
import type { DeterministicReplayValidationEvent } from './deterministic-replay-validation-events';
import {
  DeterministicReplayValidationAlreadyCompletedError,
  DeterministicReplayValidationDuplicateExecutionError,
  DeterministicReplayValidationError,
  DeterministicReplayValidationExecutionFailedError,
  DeterministicReplayValidationMismatchError,
  DeterministicReplayValidationReplayFailedError,
  DeterministicReplayValidationValidationError,
} from './deterministic-replay-validation-errors';
import {
  createDeterministicReplayValidationMetrics,
  type DeterministicReplayValidationMetrics,
} from './deterministic-replay-validation-metrics';
import {
  createDeterministicReplayValidationResult,
  type DeterministicReplayValidationResult,
} from './deterministic-replay-validation-result';
import type { ReplayMismatch } from './replay-mismatch';

export type CreateDeterministicReplayStrategy = (
  marketDataProvider: HistoricalMarketDataProvider,
) => PaperStrategy;

export type CreateDeterministicReplayService = (
  iteration: number,
  dependencies: HistoricalReplayServiceDependencies,
) => HistoricalReplayService;

export type CreateDeterministicReplayValidationResultFn = (
  properties: DeterministicReplayValidationResult,
) => DeterministicReplayValidationResult;

export type DeterministicReplayValidationServiceDependencies = Readonly<{
  dataset: HistoricalDataset | null;
  configuration: DeterministicReplayConfiguration | null;
  createStrategy?: CreateDeterministicReplayStrategy | null;
  createReplayService?: CreateDeterministicReplayService;
  createResult?: CreateDeterministicReplayValidationResultFn;
  clock?: () => string;
  createClock?: (iteration: number) => () => string;
  createSessionId?: (iteration: number, validationId: string) => string;
  createRuntimeId?: (iteration: number, validationId: string) => string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  workspaceId?: string;
  strategyId?: string;
  /**
   * When true, a repeated execute() after completion rejects with
   * DeterministicReplayValidationAlreadyCompletedError instead of returning
   * the cached result.
   */
  rejectOnRepeat?: boolean;
  applicationEventNotifier?: ApplicationEventNotifier<DeterministicReplayValidationEvent>;
}>;

const DEFAULT_WORKSPACE_ID = 'deterministic-replay-validation-workspace';
const DEFAULT_STRATEGY_ID = 'deterministic-replay-validation-strategy';

type ReplayIterationOutcome = Readonly<{
  result: ExecutionResult;
  events: readonly HistoricalReplayEvent[];
}>;

/**
 * US197 Deterministic Replay Validation application service.
 *
 * Repeatedly executes HistoricalReplayService with identical inputs and
 * compares execution outputs, metadata, and emitted events. Contains no
 * trading logic.
 */
export class DeterministicReplayValidationService {
  private readonly dataset: HistoricalDataset;
  private readonly configuration: DeterministicReplayConfiguration;
  private readonly createStrategy: CreateDeterministicReplayStrategy;
  private readonly createReplayService: CreateDeterministicReplayService;
  private readonly createResult: CreateDeterministicReplayValidationResultFn;
  private readonly clock: () => string;
  private readonly createClock: (iteration: number) => () => string;
  private readonly createSessionId: (iteration: number, validationId: string) => string;
  private readonly createRuntimeId: (iteration: number, validationId: string) => string;
  private readonly leaseDurationMs: number | undefined;
  private readonly heartbeatTimeoutMs: number | undefined;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: DeterministicReplayValidationEvent[] = [];
  private readonly notifyCompletion: (event: DeterministicReplayValidationEvent) => void;
  private readonly completionEmissionDiagnostics: () => readonly EventEmissionDiagnostic[];
  private completedResult: DeterministicReplayValidationResult | null = null;
  private inFlight = false;
  private lastMetrics: DeterministicReplayValidationMetrics | null = null;

  private constructor(dependencies: DeterministicReplayValidationServiceDependencies) {
    this.dataset = dependencies.dataset as HistoricalDataset;
    this.configuration = dependencies.configuration as DeterministicReplayConfiguration;
    this.createStrategy =
      dependencies.createStrategy ??
      ((provider) => HistoricalReplayStrategy.create({ marketDataProvider: provider }));
    this.createReplayService =
      dependencies.createReplayService ??
      ((_, replayDependencies) => HistoricalReplayService.create(replayDependencies));
    this.createResult = dependencies.createResult ?? createDeterministicReplayValidationResult;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.createClock =
      dependencies.createClock ??
      ((iteration) => {
        void iteration;
        return this.clock;
      });
    this.createSessionId =
      dependencies.createSessionId ?? ((_iteration, validationId) => `${validationId}-session`);
    this.createRuntimeId =
      dependencies.createRuntimeId ?? ((_iteration, validationId) => `${validationId}-runtime`);
    this.leaseDurationMs = dependencies.leaseDurationMs;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs;
    this.workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    this.strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
    const notificationState = createApplicationEventNotificationState(
      this.applicationEvents,
      this.clock,
      dependencies.applicationEventNotifier,
    );
    this.notifyCompletion = notificationState.notify;
    this.completionEmissionDiagnostics = notificationState.diagnostics;
  }

  static create(
    dependencies: DeterministicReplayValidationServiceDependencies,
  ): DeterministicReplayValidationService {
    if (dependencies.dataset === null || dependencies.dataset === undefined) {
      throw new DeterministicReplayValidationValidationError('dataset is required');
    }
    if (dependencies.dataset.candles.length === 0) {
      throw new DeterministicReplayValidationValidationError('dataset must not be empty');
    }
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new DeterministicReplayValidationValidationError('configuration is required');
    }

    let configuration: DeterministicReplayConfiguration;
    try {
      configuration = createDeterministicReplayConfiguration({
        validationId: dependencies.configuration.validationId,
        replayConfiguration: dependencies.configuration.replayConfiguration,
        iterations: dependencies.configuration.iterations,
        rejectOnMismatch: dependencies.configuration.rejectOnMismatch,
      });
    } catch (error) {
      throw new DeterministicReplayValidationValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    if (configuration.replayConfiguration.datasetId !== dependencies.dataset.datasetId) {
      throw new DeterministicReplayValidationValidationError(
        `configuration datasetId mismatch: ${configuration.replayConfiguration.datasetId}`,
      );
    }

    if (dependencies.createStrategy === null) {
      throw new DeterministicReplayValidationValidationError('strategy is required');
    }
    if (
      dependencies.createStrategy !== undefined &&
      typeof dependencies.createStrategy !== 'function'
    ) {
      throw new DeterministicReplayValidationValidationError('invalid strategy');
    }

    const workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    if (workspaceId === '') {
      throw new DeterministicReplayValidationValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    if (strategyId === '') {
      throw new DeterministicReplayValidationValidationError('strategyId is required');
    }

    return new DeterministicReplayValidationService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs the configured number of replays and compares each to the baseline.
   *
   * Replays execute independently with identical inputs. Idempotent for a
   * completed validation.
   */
  async execute(): Promise<DeterministicReplayValidationResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new DeterministicReplayValidationAlreadyCompletedError(
          this.completedResult.validationId,
        );
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new DeterministicReplayValidationDuplicateExecutionError();
    }

    this.inFlight = true;
    const startedAt = this.clock();
    const validationId = this.configuration.validationId;
    const datasetId = this.dataset.datasetId;
    const iterations = this.configuration.iterations;

    this.emit({
      eventType: 'DeterministicValidationStarted',
      validationId,
      occurredAt: startedAt,
      datasetId,
      iterations,
    });

    const replayOutcomes: ReplayIterationOutcome[] = [];
    const comparedResults: ExecutionResult[] = [];
    const mismatches: ReplayMismatch[] = [];
    let successfulIterations = 0;
    let failedIterations = 0;
    let failedIteration: number | null = null;

    try {
      for (let iteration = 1; iteration <= iterations; iteration += 1) {
        const outcome = await this.runReplayIteration(iteration);
        replayOutcomes.push(outcome);

        if (outcome.result.executionStatus !== ExecutionStatus.COMPLETED) {
          failedIterations += 1;
          failedIteration = iteration;
          throw new DeterministicReplayValidationReplayFailedError(
            iteration,
            new Error(outcome.result.errors.join('; ') || 'replay execution failed'),
          );
        }

        successfulIterations += 1;

        if (iteration === 1) {
          continue;
        }

        const iterationMismatches = compareReplayToBaseline(
          iteration,
          replayOutcomes[0]!.result,
          replayOutcomes[0]!.events,
          outcome.result,
          outcome.events,
        );
        mismatches.push(...iterationMismatches);

        this.notifyCompletion({
          eventType: 'ReplayCompared',
          validationId,
          occurredAt: this.clock(),
          iteration,
          matched: iterationMismatches.length === 0,
          mismatchCount: iterationMismatches.length,
        });

        comparedResults.push(outcome.result);
      }

      const deterministic = mismatches.length === 0;
      const completedAt = this.clock();
      const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

      const result = this.createResult({
        validationId,
        iterations,
        successfulIterations,
        failedIterations,
        deterministic,
        mismatches,
        baselineResult: replayOutcomes[0]!.result,
        comparedResults,
        startedAt,
        completedAt,
        duration,
      });

      this.completedResult = result;
      this.lastMetrics = createDeterministicReplayValidationMetrics({
        iterations,
        successfulIterations,
        failedIterations,
        replayCount: replayOutcomes.length,
        validationDuration: duration,
      });

      this.notifyCompletion({
        eventType: 'DeterministicValidationCompleted',
        validationId,
        occurredAt: completedAt,
        datasetId,
        iterations,
        successfulIterations,
        failedIterations,
        deterministic,
        completedAt,
      });

      if (!deterministic && this.configuration.rejectOnMismatch) {
        throw new DeterministicReplayValidationMismatchError(validationId, mismatches.length);
      }

      return result;
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const reason = mapped.message;

      this.emit({
        eventType: 'DeterministicValidationFailed',
        validationId,
        occurredAt: failedAt,
        datasetId,
        reason,
        failedAt,
        iteration: failedIteration,
      });

      const duration = Math.max(0, Date.parse(failedAt) - Date.parse(startedAt));
      const baselineResult =
        replayOutcomes[0]?.result ??
        createPlaceholderResult(validationId, datasetId, startedAt, failedAt, duration);
      const failedResult = this.createResult({
        validationId,
        iterations,
        successfulIterations,
        failedIterations,
        deterministic: false,
        mismatches,
        baselineResult,
        comparedResults,
        startedAt,
        completedAt: failedAt,
        duration,
      });
      this.completedResult = failedResult;
      this.lastMetrics = createDeterministicReplayValidationMetrics({
        iterations,
        successfulIterations,
        failedIterations,
        replayCount: replayOutcomes.length,
        validationDuration: duration,
      });

      throw mapped;
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly DeterministicReplayValidationEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): DeterministicReplayValidationMetrics | null {
    return this.lastMetrics;
  }

  lastResult(): DeterministicReplayValidationResult | null {
    return this.completedResult;
  }

  eventEmissionDiagnostics(): readonly EventEmissionDiagnostic[] {
    return this.completionEmissionDiagnostics();
  }

  validationConfiguration(): DeterministicReplayConfiguration {
    return this.configuration;
  }

  historicalDataset(): HistoricalDataset {
    return this.dataset;
  }

  private async runReplayIteration(iteration: number): Promise<ReplayIterationOutcome> {
    const validationId = this.configuration.validationId;
    const datasetId = this.dataset.datasetId;
    const replayConfiguration = this.configuration.replayConfiguration;

    let strategy: PaperStrategy;
    try {
      const marketDataProvider = HistoricalMarketDataProvider.create({
        dataset: this.dataset,
        configuration: createReplayConfiguration({
          datasetId,
          startIndex: replayConfiguration.startIndex,
          endIndex: replayConfiguration.endIndex,
          replaySpeed: replayConfiguration.replaySpeed,
        }),
      });
      strategy = this.createStrategy(marketDataProvider);
      if (strategy === null || strategy === undefined) {
        throw new DeterministicReplayValidationValidationError('invalid strategy');
      }

      const replay = this.createReplayService(iteration, {
        dataset: this.dataset,
        strategy,
        marketDataProvider,
        configuration: createReplayConfiguration({
          datasetId,
          startIndex: replayConfiguration.startIndex,
          endIndex: replayConfiguration.endIndex,
          replaySpeed: replayConfiguration.replaySpeed,
        }),
        workspaceId: this.workspaceId,
        strategyId: this.strategyId,
        clock: this.createClock(iteration),
        createSessionId: () => this.createSessionId(iteration, validationId),
        createRuntimeId: () => this.createRuntimeId(iteration, validationId),
        leaseDurationMs: this.leaseDurationMs,
        heartbeatTimeoutMs: this.heartbeatTimeoutMs,
        repository: new InMemorySmokeSessionRepository(),
      });

      const result = await replay.execute();
      return {
        result,
        events: replay.domainEvents(),
      };
    } catch (error) {
      throw this.mapReplayError(iteration, error);
    }
  }

  private mapReplayError(iteration: number, error: unknown): Error {
    if (error instanceof DeterministicReplayValidationError) {
      return error;
    }
    if (error instanceof HistoricalReplayValidationError) {
      return new DeterministicReplayValidationValidationError(error.message, error);
    }
    if (error instanceof Error) {
      return new DeterministicReplayValidationReplayFailedError(iteration, error);
    }
    return new DeterministicReplayValidationReplayFailedError(iteration, error);
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof DeterministicReplayValidationError) {
      return error;
    }
    if (error instanceof Error) {
      return new DeterministicReplayValidationExecutionFailedError(error.message, error);
    }
    return new DeterministicReplayValidationExecutionFailedError(String(error), error);
  }

  private emit(event: DeterministicReplayValidationEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}

function createPlaceholderResult(
  validationId: string,
  datasetId: string,
  startedAt: string,
  completedAt: string,
  duration: number,
): ExecutionResult {
  return createExecutionResult({
    sessionId: `${validationId}-placeholder`,
    runnerStatus: RunnerStatus.STOPPED,
    executionStatus: ExecutionStatus.FAILED,
    cyclesExecuted: 0,
    startedAt,
    completedAt,
    duration,
    eventsPublished: 0,
    errors: ['validation did not complete baseline replay'],
    datasetId,
    candlesProcessed: 0,
    replayCompleted: false,
  });
}
