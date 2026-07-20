import { HistoricalReplayStrategy, type HistoricalDataset } from '../historical-replay';
import {
  createApplicationEventNotificationState,
  type ApplicationEventNotifier,
  type EventEmissionDiagnostic,
} from '../research-api';
import {
  WalkForwardValidationError,
  WalkForwardValidationService,
  type CreateWalkForwardStrategy,
  type WalkForwardConfiguration,
  type WalkForwardResult,
  type WalkForwardValidationServiceDependencies,
} from '../walk-forward-validation';
import {
  createDatasetWalkForwardConfiguration,
  createMultiYearResearchConfiguration,
  type MultiYearResearchConfiguration,
} from './multi-year-research-configuration';
import type { MultiYearResearchEvent } from './multi-year-research-events';
import {
  MultiYearResearchAlreadyCompletedError,
  MultiYearResearchDatasetFailedError,
  MultiYearResearchDuplicateExecutionError,
  MultiYearResearchError,
  MultiYearResearchExecutionFailedError,
  MultiYearResearchValidationError,
} from './multi-year-research-errors';
import {
  createMultiYearResearchMetrics,
  type MultiYearResearchMetrics,
} from './multi-year-research-metrics';
import {
  createMultiYearResearchResult,
  type MultiYearResearchResult,
} from './multi-year-research-result';
import { createResearchSummary, type ResearchSummary } from './research-summary';

export type CreateMultiYearWalkForwardService = (
  dataset: HistoricalDataset,
  walkForwardConfiguration: WalkForwardConfiguration,
  dependencies: Omit<WalkForwardValidationServiceDependencies, 'dataset' | 'configuration'>,
) => WalkForwardValidationService;

export type CreateMultiYearResearchResultFn = (
  properties: MultiYearResearchResult,
) => MultiYearResearchResult;

export type MultiYearResearchServiceDependencies = Readonly<{
  configuration: MultiYearResearchConfiguration | null;
  createStrategy?: CreateWalkForwardStrategy | null;
  createWalkForwardService?: CreateMultiYearWalkForwardService;
  createResult?: CreateMultiYearResearchResultFn;
  clock?: () => string;
  createExecutionId?: (dataset: HistoricalDataset, researchId: string) => string;
  createSessionId?: WalkForwardValidationServiceDependencies['createSessionId'];
  createRuntimeId?: WalkForwardValidationServiceDependencies['createRuntimeId'];
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  workspaceId?: string;
  strategyId?: string;
  applicationEventNotifier?: ApplicationEventNotifier<MultiYearResearchEvent>;
  /**
   * When true, a repeated execute() after completion rejects with
   * MultiYearResearchAlreadyCompletedError instead of returning the cached result.
   */
  rejectOnRepeat?: boolean;
}>;

const DEFAULT_WORKSPACE_ID = 'multi-year-research-workspace';
const DEFAULT_STRATEGY_ID = 'multi-year-research-strategy';

/**
 * US195 Multi-Year Research application service.
 *
 * Orchestrates multiple independent WalkForwardValidationService executions
 * across historical datasets. Contains no trading logic.
 */
export class MultiYearResearchService {
  private readonly configuration: MultiYearResearchConfiguration;
  private readonly createStrategy: CreateWalkForwardStrategy;
  private readonly createWalkForwardService: CreateMultiYearWalkForwardService;
  private readonly createResult: CreateMultiYearResearchResultFn;
  private readonly clock: () => string;
  private readonly createExecutionId: (dataset: HistoricalDataset, researchId: string) => string;
  private readonly createSessionId: WalkForwardValidationServiceDependencies['createSessionId'];
  private readonly createRuntimeId: WalkForwardValidationServiceDependencies['createRuntimeId'];
  private readonly leaseDurationMs: number | undefined;
  private readonly heartbeatTimeoutMs: number | undefined;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: MultiYearResearchEvent[] = [];
  private readonly notifyCompletion: (event: MultiYearResearchEvent) => void;
  private readonly completionEmissionDiagnostics: () => readonly EventEmissionDiagnostic[];
  private completedResult: MultiYearResearchResult | null = null;
  private inFlight = false;
  private lastMetrics: MultiYearResearchMetrics | null = null;
  private lastSummary: ResearchSummary | null = null;

  private constructor(dependencies: MultiYearResearchServiceDependencies) {
    this.configuration = dependencies.configuration as MultiYearResearchConfiguration;
    this.createStrategy =
      dependencies.createStrategy ??
      ((provider) => HistoricalReplayStrategy.create({ marketDataProvider: provider }));
    this.createWalkForwardService =
      dependencies.createWalkForwardService ??
      ((dataset, walkForwardConfiguration, walkForwardDependencies) =>
        WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...walkForwardDependencies,
        }));
    this.createResult = dependencies.createResult ?? createMultiYearResearchResult;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.createExecutionId =
      dependencies.createExecutionId ??
      ((dataset, researchId) => `${researchId}-${dataset.datasetId}`);
    this.createSessionId = dependencies.createSessionId;
    this.createRuntimeId = dependencies.createRuntimeId;
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

  static create(dependencies: MultiYearResearchServiceDependencies): MultiYearResearchService {
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new MultiYearResearchValidationError('configuration is required');
    }

    let configuration: MultiYearResearchConfiguration;
    try {
      configuration = createMultiYearResearchConfiguration(dependencies.configuration);
    } catch (error) {
      throw new MultiYearResearchValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    if (dependencies.createStrategy === null) {
      throw new MultiYearResearchValidationError('strategy is required');
    }
    if (
      dependencies.createStrategy !== undefined &&
      typeof dependencies.createStrategy !== 'function'
    ) {
      throw new MultiYearResearchValidationError('invalid strategy');
    }

    const workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    if (workspaceId === '') {
      throw new MultiYearResearchValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    if (strategyId === '') {
      throw new MultiYearResearchValidationError('strategyId is required');
    }

    return new MultiYearResearchService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs one Walk Forward Validation per dataset in deterministic order.
   *
   * Datasets execute independently — no shared TradingSession, lease, or
   * runner runtime. Idempotent for a completed execution.
   */
  async execute(): Promise<MultiYearResearchResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new MultiYearResearchAlreadyCompletedError(this.completedResult.researchId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new MultiYearResearchDuplicateExecutionError();
    }

    this.inFlight = true;
    const startedAt = this.clock();
    const researchId = this.configuration.researchId;
    const datasets = this.configuration.datasets;

    this.emit({
      eventType: 'MultiYearResearchStarted',
      researchId,
      occurredAt: startedAt,
      totalDatasets: datasets.length,
    });

    const walkForwardResults: WalkForwardResult[] = [];
    let datasetsProcessed = 0;
    let datasetsSucceeded = 0;
    let datasetsFailed = 0;
    let windowsExecuted = 0;
    let candlesProcessed = 0;
    let cyclesExecuted = 0;
    let failedDatasetId: string | null = null;

    try {
      for (const dataset of datasets) {
        const datasetId = dataset.datasetId;
        const walkForwardConfiguration = createDatasetWalkForwardConfiguration(
          datasetId,
          this.configuration.walkForwardConfiguration,
        );

        let walkForward: WalkForwardValidationService;
        try {
          walkForward = this.createWalkForwardService(dataset, walkForwardConfiguration, {
            createStrategy: this.createStrategy,
            clock: this.clock,
            createExecutionId: () => this.createExecutionId(dataset, researchId),
            createSessionId: this.createSessionId,
            createRuntimeId: this.createRuntimeId,
            leaseDurationMs: this.leaseDurationMs,
            heartbeatTimeoutMs: this.heartbeatTimeoutMs,
            workspaceId: this.workspaceId,
            strategyId: this.strategyId,
          });
        } catch (error) {
          datasetsProcessed += 1;
          datasetsFailed += 1;
          failedDatasetId = datasetId;
          throw this.mapDatasetSetupError(datasetId, error);
        }

        try {
          const result = await walkForward.execute();
          walkForwardResults.push(result);
          datasetsProcessed += 1;
          datasetsSucceeded += 1;
          windowsExecuted += result.completedWindows;
          candlesProcessed += result.replayResults.reduce(
            (total, replay) => total + replay.candlesProcessed,
            0,
          );
          cyclesExecuted += result.replayResults.reduce(
            (total, replay) => total + replay.cyclesExecuted,
            0,
          );

          this.notifyCompletion({
            eventType: 'DatasetCompleted',
            researchId,
            occurredAt: this.clock(),
            datasetId,
            succeeded: true,
            totalWindows: result.totalWindows,
            completedWindows: result.completedWindows,
            failedWindows: result.failedWindows,
            reason: null,
          });
        } catch (error) {
          datasetsProcessed += 1;
          datasetsFailed += 1;
          failedDatasetId = datasetId;

          const partial = walkForward.lastResult();
          if (partial !== null) {
            walkForwardResults.push(partial);
            windowsExecuted += partial.completedWindows;
            candlesProcessed += partial.replayResults.reduce(
              (total, replay) => total + replay.candlesProcessed,
              0,
            );
            cyclesExecuted += partial.replayResults.reduce(
              (total, replay) => total + replay.cyclesExecuted,
              0,
            );
          }

          const mapped = this.mapDatasetError(datasetId, error);
          this.emit({
            eventType: 'DatasetCompleted',
            researchId,
            occurredAt: this.clock(),
            datasetId,
            succeeded: false,
            totalWindows: partial?.totalWindows ?? 0,
            completedWindows: partial?.completedWindows ?? 0,
            failedWindows: partial?.failedWindows ?? 1,
            reason: mapped.message,
          });

          if (this.configuration.stopOnFailure) {
            throw mapped;
          }
        }
      }

      const completedAt = this.clock();
      const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

      const finalized = this.finalizeSuccess({
        researchId,
        datasetsProcessed,
        datasetsSucceeded,
        datasetsFailed,
        walkForwardResults,
        startedAt,
        completedAt,
        duration,
        windowsExecuted,
        candlesProcessed,
        cyclesExecuted,
      });

      this.notifyCompletion({
        eventType: 'MultiYearResearchCompleted',
        researchId,
        occurredAt: completedAt,
        datasetsProcessed,
        datasetsSucceeded,
        datasetsFailed,
        completedAt,
      });

      return finalized;
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const duration = Math.max(0, Date.parse(failedAt) - Date.parse(startedAt));

      this.emit({
        eventType: 'MultiYearResearchFailed',
        researchId,
        occurredAt: failedAt,
        datasetId: failedDatasetId ?? 'unknown',
        reason: mapped.message,
        failedAt,
      });

      this.finalizeFailure({
        researchId,
        datasetsProcessed,
        datasetsSucceeded,
        datasetsFailed,
        walkForwardResults,
        startedAt,
        completedAt: failedAt,
        duration,
        windowsExecuted,
        candlesProcessed,
        cyclesExecuted,
      });

      throw mapped;
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly MultiYearResearchEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): MultiYearResearchMetrics | null {
    return this.lastMetrics;
  }

  researchSummary(): ResearchSummary | null {
    return this.lastSummary;
  }

  lastResult(): MultiYearResearchResult | null {
    return this.completedResult;
  }

  eventEmissionDiagnostics(): readonly EventEmissionDiagnostic[] {
    return this.completionEmissionDiagnostics();
  }

  researchConfiguration(): MultiYearResearchConfiguration {
    return this.configuration;
  }

  datasets(): readonly HistoricalDataset[] {
    return this.configuration.datasets;
  }

  private finalizeSuccess(properties: {
    researchId: string;
    datasetsProcessed: number;
    datasetsSucceeded: number;
    datasetsFailed: number;
    walkForwardResults: WalkForwardResult[];
    startedAt: string;
    completedAt: string;
    duration: number;
    windowsExecuted: number;
    candlesProcessed: number;
    cyclesExecuted: number;
  }): MultiYearResearchResult {
    const result = this.createResult({
      researchId: properties.researchId,
      datasetsProcessed: properties.datasetsProcessed,
      datasetsSucceeded: properties.datasetsSucceeded,
      datasetsFailed: properties.datasetsFailed,
      walkForwardResults: properties.walkForwardResults,
      startedAt: properties.startedAt,
      completedAt: properties.completedAt,
      duration: properties.duration,
    });

    this.completedResult = result;
    this.lastMetrics = createMultiYearResearchMetrics({
      datasetsProcessed: properties.datasetsProcessed,
      windowsExecuted: properties.windowsExecuted,
      candlesProcessed: properties.candlesProcessed,
      cyclesExecuted: properties.cyclesExecuted,
      executionDuration: properties.duration,
      failedDatasets: properties.datasetsFailed,
    });
    this.lastSummary = createResearchSummary({
      researchId: properties.researchId,
      datasetsProcessed: properties.datasetsProcessed,
      datasetsSucceeded: properties.datasetsSucceeded,
      datasetsFailed: properties.datasetsFailed,
      totalWindows: properties.windowsExecuted,
      totalCandles: properties.candlesProcessed,
      totalCycles: properties.cyclesExecuted,
      executionDuration: properties.duration,
    });
    return result;
  }

  private finalizeFailure(properties: {
    researchId: string;
    datasetsProcessed: number;
    datasetsSucceeded: number;
    datasetsFailed: number;
    walkForwardResults: WalkForwardResult[];
    startedAt: string;
    completedAt: string;
    duration: number;
    windowsExecuted: number;
    candlesProcessed: number;
    cyclesExecuted: number;
  }): void {
    const result = this.createResult({
      researchId: properties.researchId,
      datasetsProcessed: properties.datasetsProcessed,
      datasetsSucceeded: properties.datasetsSucceeded,
      datasetsFailed: properties.datasetsFailed,
      walkForwardResults: properties.walkForwardResults,
      startedAt: properties.startedAt,
      completedAt: properties.completedAt,
      duration: properties.duration,
    });
    this.completedResult = result;
    this.lastMetrics = createMultiYearResearchMetrics({
      datasetsProcessed: properties.datasetsProcessed,
      windowsExecuted: properties.windowsExecuted,
      candlesProcessed: properties.candlesProcessed,
      cyclesExecuted: properties.cyclesExecuted,
      executionDuration: properties.duration,
      failedDatasets: properties.datasetsFailed,
    });
    this.lastSummary = createResearchSummary({
      researchId: properties.researchId,
      datasetsProcessed: properties.datasetsProcessed,
      datasetsSucceeded: properties.datasetsSucceeded,
      datasetsFailed: properties.datasetsFailed,
      totalWindows: properties.windowsExecuted,
      totalCandles: properties.candlesProcessed,
      totalCycles: properties.cyclesExecuted,
      executionDuration: properties.duration,
    });
  }

  private mapDatasetSetupError(datasetId: string, error: unknown): Error {
    if (error instanceof MultiYearResearchError) {
      return error;
    }
    if (error instanceof WalkForwardValidationError) {
      return new MultiYearResearchValidationError(error.message, error);
    }
    if (error instanceof Error) {
      return new MultiYearResearchDatasetFailedError(datasetId, error);
    }
    return new MultiYearResearchDatasetFailedError(datasetId, error);
  }

  private mapDatasetError(datasetId: string, error: unknown): Error {
    if (error instanceof MultiYearResearchError) {
      return error;
    }
    if (error instanceof WalkForwardValidationError) {
      return new MultiYearResearchValidationError(error.message, error);
    }
    if (error instanceof Error) {
      return new MultiYearResearchDatasetFailedError(datasetId, error);
    }
    return new MultiYearResearchDatasetFailedError(datasetId, error);
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof MultiYearResearchError) {
      return error;
    }
    if (error instanceof Error) {
      return new MultiYearResearchExecutionFailedError(error.message, error);
    }
    return new MultiYearResearchExecutionFailedError(String(error), error);
  }

  private emit(event: MultiYearResearchEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}
