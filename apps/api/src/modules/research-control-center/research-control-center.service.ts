import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChaosTestingService, createPredefinedChaosTestingConfiguration } from '../chaos-testing';
import {
  createDeterministicReplayConfiguration,
  DeterministicReplayValidationService,
} from '../deterministic-replay-validation';
import {
  createExecutionPolicy,
  createExecutionRequest,
  ExecutionSimulatorService,
  type ExecutionResult as SimulatorExecutionResult,
} from '../execution-simulator';
import {
  createPredefinedLiveReadinessReviewConfiguration,
  LiveReadinessReviewService,
} from '../live-readiness-review';
import {
  createBenchmarkScenarioFactories,
  createPredefinedBenchmarkSuiteConfiguration,
  PerformanceBenchmarkService,
} from '../performance-benchmark';
import {
  createPerformanceAnalyticsConfiguration,
  PerformanceAnalyticsService,
} from '../performance-analytics';
import {
  createPredefinedRegressionSuiteConfiguration,
  REGRESSION_DETERMINISTIC_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_DATASET_ID,
  REGRESSION_DETERMINISTIC_ITERATIONS,
  REGRESSION_DETERMINISTIC_VALIDATION_ID,
  RegressionSuiteService,
} from '../regression-suite';
import {
  createHistoricalCandle,
  createHistoricalDataset,
  createReplayConfiguration,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import {
  createExecutionConfiguration,
  createOptimizationCriteria,
  createStrategyConfiguration,
  createStrategyOptimizationRequest,
  OPTIMIZATION_CRITERIA_TYPES,
  StrategyOptimizationService,
  type OptimizationCriteriaType,
  type OptimizationReport,
} from '../strategy-optimization';
import type { PerformanceReport } from '../performance-analytics';
import type { LiveReadinessReport } from '../live-readiness-review';
import { ResearchControlCenterStore } from './research-control-center.store';
import {
  emptyDiagnostics,
  isEngineeringSuiteKind,
  isResearchExecutionKind,
  type AnalyticsRecord,
  type DashboardSnapshot,
  type EngineeringRecord,
  type EngineeringSuiteKind,
  type OptimizationRecord,
  type ResearchControlDiagnostics,
  type ResearchControlEvent,
  type ResearchControlSettings,
  type ResearchExecutionKind,
  type ResearchExecutionRecord,
} from './research-execution-record';

export type StartResearchExecutionInput = Readonly<{
  kind: string;
  strategyId?: string;
}>;

export type StartOptimizationInput = Readonly<{
  criterion?: string;
  configurations?: ReadonlyArray<
    Readonly<{ configurationId: string; parameters?: Record<string, number> }>
  >;
}>;

export type StartAnalyticsInput = Readonly<{
  analysisId?: string;
  executionCount?: number;
}>;

export type StartEngineeringInput = Readonly<{
  kind: string;
}>;

export type UpdateSettingsInput = Readonly<{
  autoRefreshSeconds?: number;
  defaultStrategyId?: string;
  maxListedExecutions?: number;
}>;

/**
 * US192 Research Control Center application facade.
 *
 * Wires Research Platform services (US190–US203) behind a stable HTTP contract.
 * Contains no trading logic; orchestrates research/engineering executions only.
 */
@Injectable()
export class ResearchControlCenterService {
  constructor(private readonly store: ResearchControlCenterStore) {}

  getDashboard(workspaceId: string): DashboardSnapshot {
    const limit = this.store.getSettings().maxListedExecutions;
    const research = this.store.listResearch(workspaceId, limit);
    const optimizations = this.store.listOptimizations(workspaceId, limit);
    const engineering = this.store.listEngineering(workspaceId, limit);
    const active = this.store.listActive(workspaceId);

    const latestReadiness = engineering.find((r) => r.kind === 'LiveReadinessReview') ?? null;
    const recentBenchmark = engineering.find((r) => r.kind === 'PerformanceBenchmark') ?? null;

    let platformStatus: DashboardSnapshot['platformStatus'] = 'operational';
    if (active.some((r) => r.status === 'failed')) {
      platformStatus = 'degraded';
    }
    if (research.some((r) => r.status === 'failed') && research.length > 0) {
      const recentFailures = research.filter((r) => r.status === 'failed').length;
      if (recentFailures >= 3) {
        platformStatus = 'degraded';
      }
    }

    return Object.freeze({
      platformStatus,
      activeExecutions: active.length,
      latestResearchRuns: research.slice(0, 10),
      latestOptimizationRuns: optimizations.slice(0, 10),
      latestReadinessReport: latestReadiness,
      recentBenchmarkStatus: recentBenchmark,
      generatedAt: new Date().toISOString(),
    });
  }

  listResearch(workspaceId: string): ResearchExecutionRecord[] {
    return this.store.listResearch(workspaceId, this.store.getSettings().maxListedExecutions);
  }

  getResearch(workspaceId: string, id: string): ResearchExecutionRecord {
    const record = this.store.getResearch(id);
    if (record === null || record.workspaceId !== workspaceId) {
      throw new NotFoundException(`Research execution ${id} not found`);
    }
    return record;
  }

  listActive(workspaceId: string) {
    return this.store.listActive(workspaceId);
  }

  startResearch(workspaceId: string, input: StartResearchExecutionInput): ResearchExecutionRecord {
    if (!isResearchExecutionKind(input.kind)) {
      throw new BadRequestException(
        `Unsupported research kind: ${input.kind}. Expected one of SmokeBacktest, HistoricalReplay, WalkForwardValidation, MultiYearResearch`,
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const strategyId = input.strategyId?.trim() || this.store.getSettings().defaultStrategyId;

    const record: ResearchExecutionRecord = Object.freeze({
      id,
      kind: input.kind,
      category: 'research',
      status: 'pending',
      workspaceId,
      strategyId,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      progress: 0,
      error: null,
      result: null,
      events: Object.freeze([
        Object.freeze({
          eventType: 'ExecutionQueued',
          occurredAt: now,
          payload: Object.freeze({ kind: input.kind }),
        }),
      ]),
      diagnostics: emptyDiagnostics(),
      createdAt: now,
      updatedAt: now,
    });

    this.store.putResearch(record);
    void this.runResearch(record);
    return record;
  }

  cancelResearch(workspaceId: string, id: string): ResearchExecutionRecord {
    const existing = this.getResearch(workspaceId, id);
    if (existing.status === 'completed' || existing.status === 'failed') {
      throw new BadRequestException(`Cannot cancel execution in status ${existing.status}`);
    }
    if (existing.status === 'cancelled') {
      return existing;
    }
    if (existing.status === 'running') {
      throw new BadRequestException(
        'Cancel is not supported while research services are mid-execute; wait for completion',
      );
    }

    const now = new Date().toISOString();
    const cancelled: ResearchExecutionRecord = Object.freeze({
      ...existing,
      status: 'cancelled',
      completedAt: now,
      updatedAt: now,
      events: Object.freeze([
        ...existing.events,
        Object.freeze({
          eventType: 'ExecutionCancelled',
          occurredAt: now,
        }),
      ]),
    });
    return this.store.putResearch(cancelled);
  }

  listOptimizations(workspaceId: string): OptimizationRecord[] {
    return this.store.listOptimizations(workspaceId, this.store.getSettings().maxListedExecutions);
  }

  getOptimization(workspaceId: string, id: string): OptimizationRecord {
    const record = this.store.getOptimization(id);
    if (record === null || record.workspaceId !== workspaceId) {
      throw new NotFoundException(`Optimization ${id} not found`);
    }
    return record;
  }

  startOptimization(workspaceId: string, input: StartOptimizationInput): OptimizationRecord {
    const criterion = (input.criterion ?? 'highestExecutionSuccessRate').trim();
    if (!isOptimizationCriteriaType(criterion)) {
      throw new BadRequestException(`Unsupported optimization criterion: ${criterion}`);
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const configurations = input.configurations ?? defaultOptimizationConfigurations();

    const record: OptimizationRecord = Object.freeze({
      id,
      category: 'optimization',
      status: 'pending',
      workspaceId,
      criterion,
      configurationCount: configurations.length,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      progress: 0,
      error: null,
      report: null,
      events: Object.freeze([
        Object.freeze({
          eventType: 'OptimizationQueued',
          occurredAt: now,
          payload: Object.freeze({ criterion, configurationCount: configurations.length }),
        }),
      ]),
      diagnostics: emptyDiagnostics(),
      createdAt: now,
      updatedAt: now,
    });

    this.store.putOptimization(record);
    void this.runOptimization(record, configurations, criterion);
    return record;
  }

  listAnalytics(workspaceId: string): AnalyticsRecord[] {
    return this.store.listAnalytics(workspaceId, this.store.getSettings().maxListedExecutions);
  }

  getAnalytics(workspaceId: string, id: string): AnalyticsRecord {
    const record = this.store.getAnalytics(id);
    if (record === null || record.workspaceId !== workspaceId) {
      throw new NotFoundException(`Analytics report ${id} not found`);
    }
    return record;
  }

  startAnalytics(workspaceId: string, input: StartAnalyticsInput): AnalyticsRecord {
    const id = input.analysisId?.trim() || randomUUID();
    const now = new Date().toISOString();
    const executionCount = input.executionCount ?? 4;

    if (!Number.isInteger(executionCount) || executionCount < 1 || executionCount > 100) {
      throw new BadRequestException('executionCount must be an integer between 1 and 100');
    }

    const record: AnalyticsRecord = Object.freeze({
      id,
      category: 'analytics',
      status: 'pending',
      workspaceId,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      progress: 0,
      error: null,
      report: null,
      events: Object.freeze([
        Object.freeze({
          eventType: 'AnalyticsQueued',
          occurredAt: now,
          payload: Object.freeze({ executionCount }),
        }),
      ]),
      diagnostics: emptyDiagnostics(),
      createdAt: now,
      updatedAt: now,
    });

    this.store.putAnalytics(record);
    void this.runAnalytics(record, executionCount);
    return record;
  }

  listEngineering(workspaceId: string): EngineeringRecord[] {
    return this.store.listEngineering(workspaceId, this.store.getSettings().maxListedExecutions);
  }

  getEngineering(workspaceId: string, id: string): EngineeringRecord {
    const record = this.store.getEngineering(id);
    if (record === null || record.workspaceId !== workspaceId) {
      throw new NotFoundException(`Engineering run ${id} not found`);
    }
    return record;
  }

  startEngineering(workspaceId: string, input: StartEngineeringInput): EngineeringRecord {
    if (!isEngineeringSuiteKind(input.kind)) {
      throw new BadRequestException(`Unsupported engineering suite: ${input.kind}`);
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const record: EngineeringRecord = Object.freeze({
      id,
      kind: input.kind,
      category: 'engineering',
      status: 'pending',
      workspaceId,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      progress: 0,
      error: null,
      report: null,
      events: Object.freeze([
        Object.freeze({
          eventType: 'EngineeringQueued',
          occurredAt: now,
          payload: Object.freeze({ kind: input.kind }),
        }),
      ]),
      diagnostics: emptyDiagnostics(),
      createdAt: now,
      updatedAt: now,
    });

    this.store.putEngineering(record);
    void this.runEngineering(record);
    return record;
  }

  getDiagnostics(workspaceId: string) {
    const collected = this.store.collectDiagnostics(workspaceId);
    return Object.freeze({
      workspaceId,
      generatedAt: new Date().toISOString(),
      ...collected,
    });
  }

  getSettings(): ResearchControlSettings {
    return this.store.getSettings();
  }

  updateSettings(input: UpdateSettingsInput): ResearchControlSettings {
    if (
      input.autoRefreshSeconds !== undefined &&
      (!Number.isInteger(input.autoRefreshSeconds) ||
        input.autoRefreshSeconds < 1 ||
        input.autoRefreshSeconds > 120)
    ) {
      throw new BadRequestException('autoRefreshSeconds must be an integer between 1 and 120');
    }
    if (
      input.maxListedExecutions !== undefined &&
      (!Number.isInteger(input.maxListedExecutions) ||
        input.maxListedExecutions < 10 ||
        input.maxListedExecutions > 500)
    ) {
      throw new BadRequestException('maxListedExecutions must be an integer between 10 and 500');
    }
    if (input.defaultStrategyId !== undefined && input.defaultStrategyId.trim() === '') {
      throw new BadRequestException('defaultStrategyId must not be empty');
    }

    return this.store.updateSettings({
      autoRefreshSeconds: input.autoRefreshSeconds,
      defaultStrategyId: input.defaultStrategyId?.trim(),
      maxListedExecutions: input.maxListedExecutions,
    });
  }

  private async runResearch(initial: ResearchExecutionRecord): Promise<void> {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    this.store.putResearch(
      Object.freeze({
        ...initial,
        status: 'running',
        startedAt,
        progress: 10,
        updatedAt: startedAt,
        events: appendEvent(initial.events, {
          eventType: 'ExecutionStarted',
          occurredAt: startedAt,
        }),
      }),
    );

    try {
      const context = {
        clock: () => new Date().toISOString(),
        workspaceId: initial.workspaceId,
        strategyId: initial.strategyId ?? this.store.getSettings().defaultStrategyId,
        leaseDurationMs: 60_000,
        heartbeatTimeoutMs: 300_000,
      };
      const factories = createBenchmarkScenarioFactories(context);
      let result: unknown;
      let events: ResearchControlEvent[] = [];
      let diagnostics = emptyDiagnostics();

      switch (initial.kind as ResearchExecutionKind) {
        case 'SmokeBacktest': {
          const service = factories.createSmokeBacktestService();
          result = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          diagnostics = diagnosticsFromUnknown(service.eventEmissionDiagnostics());
          break;
        }
        case 'HistoricalReplay': {
          const service = factories.createHistoricalReplayService();
          result = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          diagnostics = diagnosticsFromUnknown(service.eventEmissionDiagnostics());
          break;
        }
        case 'WalkForwardValidation': {
          const service = factories.createWalkForwardValidationService();
          result = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          break;
        }
        case 'MultiYearResearch': {
          const service = factories.createMultiYearResearchService();
          result = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          break;
        }
      }

      const completedAt = new Date().toISOString();
      const current = this.store.getResearch(initial.id);
      if (current === null || current.status === 'cancelled') {
        return;
      }

      this.store.putResearch(
        Object.freeze({
          ...current,
          status: 'completed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          result: serialize(result),
          events: Object.freeze([
            ...current.events,
            ...events,
            Object.freeze({
              eventType: 'ExecutionCompleted',
              occurredAt: completedAt,
            }),
          ]),
          diagnostics,
          updatedAt: completedAt,
        }),
      );
    } catch (error) {
      const completedAt = new Date().toISOString();
      const current = this.store.getResearch(initial.id);
      if (current === null) {
        return;
      }
      this.store.putResearch(
        Object.freeze({
          ...current,
          status: 'failed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          error: errorMessage(error),
          events: appendEvent(current.events, {
            eventType: 'ExecutionFailed',
            occurredAt: completedAt,
            payload: Object.freeze({ message: errorMessage(error) }),
          }),
          diagnostics: Object.freeze({
            ...emptyDiagnostics(),
            anomalies: Object.freeze([errorMessage(error)]),
            recommendations: Object.freeze([
              'Review execution diagnostics and retry the research run',
            ]),
          }),
          updatedAt: completedAt,
        }),
      );
    }
  }

  private async runOptimization(
    initial: OptimizationRecord,
    configurations: ReadonlyArray<
      Readonly<{ configurationId: string; parameters?: Record<string, number> }>
    >,
    criterion: OptimizationCriteriaType,
  ): Promise<void> {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    this.store.putOptimization(
      Object.freeze({
        ...initial,
        status: 'running',
        startedAt,
        progress: 10,
        updatedAt: startedAt,
        events: appendEvent(initial.events, {
          eventType: 'OptimizationStarted',
          occurredAt: startedAt,
        }),
      }),
    );

    try {
      const strategyConfigurations = configurations.map((cfg) =>
        createStrategyConfiguration({
          configurationId: cfg.configurationId,
          parameters: cfg.parameters ?? { deterministicSlippage: 0 },
        }),
      );

      const request = createStrategyOptimizationRequest({
        optimizationId: initial.id,
        strategyConfigurations,
        optimizationCriteria: createOptimizationCriteria(
          criterion === 'customWeightedScore'
            ? {
                criterion,
                weights: {
                  executionSuccessRate: 1,
                  averageSlippage: 1,
                  totalCommission: 1,
                },
              }
            : { criterion },
        ),
        executionConfiguration: createExecutionConfiguration({
          executionRequests: [
            createExecutionRequest({
              requestId: `${initial.id}-req-1`,
              symbol: 'BTCUSDT',
              side: 'BUY',
              quantity: 4,
              requestedPrice: 100,
              timestamp: '2026-07-20T10:00:00.000Z',
            }),
            createExecutionRequest({
              requestId: `${initial.id}-req-2`,
              symbol: 'BTCUSDT',
              side: 'SELL',
              quantity: 4,
              requestedPrice: 50,
              timestamp: '2026-07-20T10:01:00.000Z',
            }),
          ],
          executionPolicy: createExecutionPolicy({
            allowPartialFill: false,
            deterministicSlippage: 0,
            fixedCommission: 1,
          }),
          performanceAnalyticsConfiguration: createPerformanceAnalyticsConfiguration({
            requestedPricesByRequestId: {
              [`${initial.id}-req-1`]: 100,
              [`${initial.id}-req-2`]: 50,
            },
          }),
          workspaceId: initial.workspaceId,
          strategyId: this.store.getSettings().defaultStrategyId,
        }),
      });

      const service = StrategyOptimizationService.create(request);
      const report = (await service.execute()) as OptimizationReport;
      const completedAt = new Date().toISOString();
      const current = this.store.getOptimization(initial.id);
      if (current === null) {
        return;
      }

      const diag = report.diagnostics;
      this.store.putOptimization(
        Object.freeze({
          ...current,
          status: 'completed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          report: serialize(report),
          events: Object.freeze([
            ...current.events,
            ...mapDomainEvents(service.applicationEvents()),
            Object.freeze({
              eventType: 'OptimizationCompleted',
              occurredAt: completedAt,
            }),
          ]),
          diagnostics: Object.freeze({
            warnings: Object.freeze([...(diag?.warnings ?? [])]),
            anomalies: Object.freeze([]),
            recommendations: Object.freeze([...(diag?.validationMessages ?? [])]),
            eventEmission: Object.freeze([]),
          }),
          updatedAt: completedAt,
        }),
      );
    } catch (error) {
      this.failOptimization(initial.id, startedMs, error);
    }
  }

  private failOptimization(id: string, startedMs: number, error: unknown): void {
    const completedAt = new Date().toISOString();
    const current = this.store.getOptimization(id);
    if (current === null) {
      return;
    }
    this.store.putOptimization(
      Object.freeze({
        ...current,
        status: 'failed',
        progress: 100,
        completedAt,
        durationMs: Date.now() - startedMs,
        error: errorMessage(error),
        events: appendEvent(current.events, {
          eventType: 'OptimizationFailed',
          occurredAt: completedAt,
          payload: Object.freeze({ message: errorMessage(error) }),
        }),
        diagnostics: Object.freeze({
          ...emptyDiagnostics(),
          anomalies: Object.freeze([errorMessage(error)]),
          recommendations: Object.freeze(['Adjust configurations and retry optimization']),
        }),
        updatedAt: completedAt,
      }),
    );
  }

  private async runAnalytics(initial: AnalyticsRecord, executionCount: number): Promise<void> {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    this.store.putAnalytics(
      Object.freeze({
        ...initial,
        status: 'running',
        startedAt,
        progress: 20,
        updatedAt: startedAt,
        events: appendEvent(initial.events, {
          eventType: 'AnalyticsStarted',
          occurredAt: startedAt,
        }),
      }),
    );

    try {
      const simulator = ExecutionSimulatorService.create();
      const policy = createExecutionPolicy({
        allowPartialFill: false,
        deterministicSlippage: 0.1,
        fixedCommission: 0.5,
      });
      const executionResults: SimulatorExecutionResult[] = [];
      for (let index = 0; index < executionCount; index += 1) {
        const result = simulator.simulate(
          createExecutionRequest({
            requestId: `${initial.id}-sim-${index}`,
            symbol: 'BTCUSDT',
            side: index % 2 === 0 ? 'BUY' : 'SELL',
            quantity: 2 + (index % 3),
            requestedPrice: 100 + index,
            timestamp: `2026-07-20T11:${String(Math.min(index, 59)).padStart(2, '0')}:00.000Z`,
          }),
          policy,
        );
        executionResults.push(result);
      }

      const analytics = PerformanceAnalyticsService.create();
      const report = analytics.analyze({
        analysisId: initial.id,
        executionResults,
        configuration: createPerformanceAnalyticsConfiguration({
          requestedPricesByRequestId: Object.fromEntries(
            executionResults.map((r, index) => [r.requestId, 100 + index]),
          ),
        }),
      }) as PerformanceReport;

      const completedAt = new Date().toISOString();
      const current = this.store.getAnalytics(initial.id);
      if (current === null) {
        return;
      }

      this.store.putAnalytics(
        Object.freeze({
          ...current,
          status: 'completed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          report: serialize(report),
          events: Object.freeze([
            ...current.events,
            ...mapDomainEvents(analytics.applicationEvents()),
            Object.freeze({
              eventType: 'AnalyticsCompleted',
              occurredAt: completedAt,
            }),
          ]),
          diagnostics: Object.freeze({
            warnings: Object.freeze([...(report.diagnostics.warnings ?? [])]),
            anomalies: Object.freeze([...(report.diagnostics.anomalies ?? [])]),
            recommendations: Object.freeze([...(report.diagnostics.validationMessages ?? [])]),
            eventEmission: Object.freeze([]),
          }),
          updatedAt: completedAt,
        }),
      );
    } catch (error) {
      const completedAt = new Date().toISOString();
      const current = this.store.getAnalytics(initial.id);
      if (current === null) {
        return;
      }
      this.store.putAnalytics(
        Object.freeze({
          ...current,
          status: 'failed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          error: errorMessage(error),
          events: appendEvent(current.events, {
            eventType: 'AnalyticsFailed',
            occurredAt: completedAt,
            payload: Object.freeze({ message: errorMessage(error) }),
          }),
          updatedAt: completedAt,
        }),
      );
    }
  }

  private async runEngineering(initial: EngineeringRecord): Promise<void> {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    this.store.putEngineering(
      Object.freeze({
        ...initial,
        status: 'running',
        startedAt,
        progress: 10,
        updatedAt: startedAt,
        events: appendEvent(initial.events, {
          eventType: 'EngineeringStarted',
          occurredAt: startedAt,
        }),
      }),
    );

    try {
      const clock = () => new Date().toISOString();
      const workspaceId = initial.workspaceId;
      const strategyId = this.store.getSettings().defaultStrategyId;
      let report: unknown;
      let events: ResearchControlEvent[] = [];
      let diagnostics = emptyDiagnostics();

      switch (initial.kind as EngineeringSuiteKind) {
        case 'PerformanceBenchmark': {
          const service = PerformanceBenchmarkService.create({
            configuration: createPredefinedBenchmarkSuiteConfiguration(),
            clock,
            workspaceId,
            strategyId,
          });
          report = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          break;
        }
        case 'DeterministicReplayValidation': {
          const dataset = createHistoricalDataset({
            datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
            symbol: 'BTCUSDT',
            timeframe: Timeframe.M5,
            candles: Array.from({ length: REGRESSION_DETERMINISTIC_CANDLE_COUNT }, (_, index) =>
              createHistoricalCandle({
                timestamp: `2026-07-19T20:${String(index * 5).padStart(2, '0')}:00.000Z`,
                open: 100 + index,
                high: 110 + index,
                low: 95 + index,
                close: 105 + index,
                volume: 1_000 + index,
              }),
            ),
          });
          const service = DeterministicReplayValidationService.create({
            dataset,
            configuration: createDeterministicReplayConfiguration({
              validationId: REGRESSION_DETERMINISTIC_VALIDATION_ID,
              replayConfiguration: createReplayConfiguration({
                datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
                endIndex: REGRESSION_DETERMINISTIC_CANDLE_COUNT - 1,
              }),
              iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
              rejectOnMismatch: false,
            }),
            clock,
            workspaceId,
            strategyId,
          });
          report = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          break;
        }
        case 'RegressionSuite': {
          const service = RegressionSuiteService.create({
            configuration: createPredefinedRegressionSuiteConfiguration(),
            clock,
            workspaceId,
            strategyId,
          });
          report = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          break;
        }
        case 'ChaosTesting': {
          const service = ChaosTestingService.create({
            configuration: createPredefinedChaosTestingConfiguration(),
            clock,
            workspaceId,
            strategyId,
          });
          report = await service.execute();
          events = mapDomainEvents(service.domainEvents());
          break;
        }
        case 'LiveReadinessReview': {
          const service = LiveReadinessReviewService.create({
            configuration: createPredefinedLiveReadinessReviewConfiguration(),
            clock,
            workspaceId,
            strategyId,
          });
          const readiness = (await service.execute()) as LiveReadinessReport;
          report = readiness;
          events = mapDomainEvents(service.domainEvents());
          diagnostics = Object.freeze({
            warnings: Object.freeze([...readiness.warnings]),
            anomalies: Object.freeze(
              readiness.overallStatus === 'NOT_READY'
                ? ['Platform is not ready for live operation']
                : [],
            ),
            recommendations: Object.freeze([...readiness.recommendations]),
            eventEmission: Object.freeze([]),
          });
          break;
        }
      }

      const completedAt = new Date().toISOString();
      const current = this.store.getEngineering(initial.id);
      if (current === null) {
        return;
      }

      this.store.putEngineering(
        Object.freeze({
          ...current,
          status: 'completed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          report: serialize(report),
          events: Object.freeze([
            ...current.events,
            ...events,
            Object.freeze({
              eventType: 'EngineeringCompleted',
              occurredAt: completedAt,
            }),
          ]),
          diagnostics,
          updatedAt: completedAt,
        }),
      );
    } catch (error) {
      const completedAt = new Date().toISOString();
      const current = this.store.getEngineering(initial.id);
      if (current === null) {
        return;
      }
      this.store.putEngineering(
        Object.freeze({
          ...current,
          status: 'failed',
          progress: 100,
          completedAt,
          durationMs: Date.now() - startedMs,
          error: errorMessage(error),
          events: appendEvent(current.events, {
            eventType: 'EngineeringFailed',
            occurredAt: completedAt,
            payload: Object.freeze({ message: errorMessage(error) }),
          }),
          diagnostics: Object.freeze({
            ...emptyDiagnostics(),
            anomalies: Object.freeze([errorMessage(error)]),
            recommendations: Object.freeze([
              'Inspect engineering diagnostics and re-run the suite',
            ]),
          }),
          updatedAt: completedAt,
        }),
      );
    }
  }
}

function defaultOptimizationConfigurations() {
  return Object.freeze([
    Object.freeze({
      configurationId: 'cfg-low-slippage',
      parameters: Object.freeze({ deterministicSlippage: 0 }),
    }),
    Object.freeze({
      configurationId: 'cfg-mid-slippage',
      parameters: Object.freeze({ deterministicSlippage: 0.5 }),
    }),
    Object.freeze({
      configurationId: 'cfg-high-slippage',
      parameters: Object.freeze({ deterministicSlippage: 1.5 }),
    }),
  ]);
}

function isOptimizationCriteriaType(value: string): value is OptimizationCriteriaType {
  return (OPTIMIZATION_CRITERIA_TYPES as readonly string[]).includes(value);
}

function appendEvent(
  events: readonly ResearchControlEvent[],
  event: ResearchControlEvent,
): readonly ResearchControlEvent[] {
  return Object.freeze([...events, Object.freeze(event)]);
}

function mapDomainEvents(events: readonly unknown[]): ResearchControlEvent[] {
  return events.map((event) => {
    const record = event as Record<string, unknown>;
    const eventType = typeof record.eventType === 'string' ? record.eventType : 'DomainEvent';
    const occurredAt =
      typeof record.occurredAt === 'string' ? record.occurredAt : new Date().toISOString();
    const { eventType: _et, occurredAt: _oa, ...payload } = record;
    return Object.freeze({
      eventType,
      occurredAt,
      payload: Object.freeze(payload as Record<string, unknown>),
    });
  });
}

function diagnosticsFromUnknown(items: readonly unknown[]): ResearchControlDiagnostics {
  const eventEmission = items.map((item) =>
    Object.freeze(
      typeof item === 'object' && item !== null
        ? (item as Record<string, unknown>)
        : Object.freeze({ value: item }),
    ),
  );
  return Object.freeze({
    warnings: Object.freeze([]),
    anomalies: Object.freeze([]),
    recommendations: Object.freeze([]),
    eventEmission: Object.freeze(eventEmission),
  });
}

function serialize(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
