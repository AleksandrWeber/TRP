import type { ExecutionPolicy } from '../execution-simulator';
import { createHash } from 'node:crypto';
import {
  ExecutionSimulatorService,
  createExecutionPolicy,
  type ExecutionSimulatorClock,
} from '../execution-simulator';
import type { PerformanceReport, PerformanceAnalyticsClock } from '../performance-analytics';
import { PerformanceAnalyticsService } from '../performance-analytics';
import type { StrategyConfiguration } from './strategy-configuration';
import type { StrategyOptimizationRequest } from './strategy-optimization-request';
import type { CustomScoreWeights } from './optimization-criteria';
import type { OptimizationResult } from './optimization-result';
import type { OptimizationReport } from './optimization-report';
import { createOptimizationReport, deterministicOptimizationReportId } from './optimization-report';
import type { StrategyOptimizationMetrics } from './strategy-optimization-metrics';
import { createStrategyOptimizationMetrics } from './strategy-optimization-metrics';
import type { StrategyOptimizationEvent } from './strategy-optimization-events';
import {
  StrategyOptimizationAlreadyCompletedError,
  StrategyOptimizationConfigurationFailedError,
  StrategyOptimizationDuplicateExecutionError,
} from './strategy-optimization-errors';
import { createOptimizationDiagnostics } from './optimization-diagnostics';
import { createOptimizationResult } from './optimization-result';

/**
 * US203 Strategy Optimization application service.
 *
 * Evaluates multiple predefined strategy configurations deterministically
 * against a shared execution plan, ranks them by selected criteria using
 * PerformanceAnalytics (US202), and returns an immutable OptimizationReport.
 *
 * No portfolio persistence and no broker integration: all state is in-memory
 * and scoped to a single execute() run.
 */
export class StrategyOptimizationService {
  private readonly request: StrategyOptimizationRequest;
  private readonly clock: StrategyOptimizationClock;
  private readonly performanceAnalyticsClock: PerformanceAnalyticsClock;
  private readonly executionSimulatorClock: ExecutionSimulatorClock;
  private readonly rejectOnRepeat: boolean;

  private completedReport: OptimizationReport | null = null;
  private inFlight = false;
  private readonly collectedEvents: StrategyOptimizationEvent[] = [];

  private lastMetrics: StrategyOptimizationMetrics | null = null;
  private reportsGenerated = 0;
  private configurationsEvaluated = 0;
  private totalExecutionDuration = 0;

  private constructor(
    deps: StrategyOptimizationServiceDependencies,
    request: StrategyOptimizationRequest,
  ) {
    this.request = request;
    this.clock = deps.clock;
    this.performanceAnalyticsClock = deps.performanceAnalyticsClock;
    this.executionSimulatorClock = deps.executionSimulatorClock;
    this.rejectOnRepeat = deps.rejectOnRepeat;
  }

  static create(
    request: StrategyOptimizationRequest,
    deps: Partial<StrategyOptimizationServiceDependencies> = {},
  ): StrategyOptimizationService {
    const clock = deps.clock ?? createDeterministicClock(request.optimizationId);
    return new StrategyOptimizationService(
      {
        clock,
        performanceAnalyticsClock: deps.performanceAnalyticsClock ?? clock,
        executionSimulatorClock: deps.executionSimulatorClock ?? clock,
        rejectOnRepeat: deps.rejectOnRepeat === true,
      },
      request,
    );
  }

  async execute(): Promise<OptimizationReport> {
    if (this.completedReport !== null) {
      if (this.rejectOnRepeat) {
        throw new StrategyOptimizationAlreadyCompletedError(this.request.optimizationId);
      }
      return this.completedReport;
    }
    if (this.inFlight) {
      throw new StrategyOptimizationDuplicateExecutionError();
    }

    this.inFlight = true;
    // Yield so concurrent execute() calls can observe inFlight=true.
    await Promise.resolve();
    const startedAtMs = this.clock.now();
    const startedAt = this.clock.iso();

    try {
      this.recordEvent({
        eventType: 'OptimizationStarted',
        optimizationId: this.request.optimizationId,
        occurredAt: startedAt,
        configurationCount: this.request.strategyConfigurations.length,
        criteria: this.request.optimizationCriteria.criterion,
      });

      const evaluations: Array<{
        configurationId: string;
        performanceReport: PerformanceReport;
      }> = [];
      for (let index = 0; index < this.request.strategyConfigurations.length; index += 1) {
        const configuration = this.request.strategyConfigurations[index]!;
        const performanceReport = this.evaluateConfiguration(configuration);
        evaluations.push({ configurationId: configuration.configurationId, performanceReport });
        this.configurationsEvaluated += 1;

        this.recordEvent({
          eventType: 'ConfigurationEvaluated',
          optimizationId: this.request.optimizationId,
          occurredAt: this.clock.iso(),
          configurationId: configuration.configurationId,
          reportId: performanceReport.reportId,
          totalExecutions: performanceReport.totalExecutions,
          executionSuccessRate: performanceReport.executionSuccessRate,
        });
      }

      const rankedResults = this.rankEvaluations(evaluations);
      const best = rankedResults[0]!;

      const diagnostics = this.createDiagnostics(rankedResults.map((r) => r.performanceReport));

      const report = createOptimizationReport({
        reportId: deterministicOptimizationReportId(this.request.optimizationId),
        bestConfiguration: best,
        rankedResults,
        diagnostics,
      });

      this.completedReport = report;
      const completedAt = this.clock.iso();

      this.recordEvent({
        eventType: 'OptimizationCompleted',
        optimizationId: this.request.optimizationId,
        occurredAt: completedAt,
        reportId: report.reportId,
        bestConfigurationId: best.configurationId,
        configurationsEvaluated: this.configurationsEvaluated,
        completedAt,
      });

      return report;
    } finally {
      const completedMs = this.clock.now();
      this.totalExecutionDuration = Math.max(0, completedMs - startedAtMs);
      this.lastMetrics = createStrategyOptimizationMetrics({
        configurationsEvaluated: this.configurationsEvaluated,
        optimizationDuration: this.totalExecutionDuration,
        reportsGenerated: this.reportsGenerated,
      });
      this.inFlight = false;
    }
  }

  applicationEvents(): readonly StrategyOptimizationEvent[] {
    return Object.freeze([...this.collectedEvents]);
  }

  metrics(): StrategyOptimizationMetrics {
    return (
      this.lastMetrics ??
      createStrategyOptimizationMetrics({
        configurationsEvaluated: 0,
        optimizationDuration: 0,
        reportsGenerated: 0,
      })
    );
  }

  lastReport(): OptimizationReport | null {
    return this.completedReport;
  }

  private evaluateConfiguration(configuration: StrategyConfiguration): PerformanceReport {
    try {
      const executionPolicy = applyStrategyParametersToExecutionPolicy(
        this.request.executionConfiguration.executionPolicy,
        configuration.parameters,
      );

      const simulator = ExecutionSimulatorService.create({
        clock: this.executionSimulatorClock,
      });

      const executionResults = this.request.executionConfiguration.executionRequests.map(
        (request) => simulator.simulate(request, executionPolicy),
      );

      const performanceAnalytics = PerformanceAnalyticsService.create({
        clock: this.performanceAnalyticsClock,
      });

      const performanceReport = performanceAnalytics.analyze({
        analysisId: deterministicAnalysisId(
          this.request.optimizationId,
          configuration.configurationId,
        ),
        executionResults,
        configuration: this.request.executionConfiguration.performanceAnalyticsConfiguration,
      });

      this.reportsGenerated += 1;
      return performanceReport;
    } catch (error) {
      throw new StrategyOptimizationConfigurationFailedError(configuration.configurationId, error);
    }
  }

  private rankEvaluations(
    evaluations: readonly {
      configurationId: string;
      performanceReport: PerformanceReport;
    }[],
  ): OptimizationResult[] {
    const criteria = this.request.optimizationCriteria;

    const scores = evaluations.map((evaluation) => {
      const report = evaluation.performanceReport;

      if (criteria.criterion === 'highestExecutionSuccessRate') {
        return report.executionSuccessRate;
      }
      if (criteria.criterion === 'lowestAverageSlippage') {
        return -report.averageSlippage;
      }
      if (criteria.criterion === 'lowestCommission') {
        return -report.averageCommission;
      }

      // customWeightedScore is computed using all candidates.
      return NaN;
    });

    const computedScores =
      criteria.criterion === 'customWeightedScore'
        ? computeCustomWeightedScores(
            evaluations.map((e) => e.performanceReport),
            criteria.weights,
          )
        : scores;

    const withScore = evaluations.map((evaluation, index) => {
      return createOptimizationResult({
        configurationId: evaluation.configurationId,
        performanceReport: evaluation.performanceReport,
        score: computedScores[index]!,
        rank: 1,
      });
    });

    // Sort best → worst. For equal scores, keep deterministic tie-breaking by
    // configurationId (lexicographical).
    const sorted = [...withScore].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.configurationId.localeCompare(b.configurationId);
    });

    // Assign ranks deterministically.
    return sorted.map((result, idx) =>
      createOptimizationResult({
        configurationId: result.configurationId,
        performanceReport: result.performanceReport,
        score: result.score,
        rank: idx + 1,
      }),
    );
  }

  private createDiagnostics(
    reports: readonly PerformanceReport[],
  ): ReturnType<typeof createOptimizationDiagnostics> {
    const warnings = reports.flatMap((r) => r.diagnostics.warnings);
    const validationMessages = reports.flatMap((r) => r.diagnostics.validationMessages);
    const criteriaApplied =
      this.request.optimizationCriteria.criterion === 'customWeightedScore'
        ? `customWeightedScore(${JSON.stringify(this.request.optimizationCriteria.weights)})`
        : this.request.optimizationCriteria.criterion;

    return createOptimizationDiagnostics({
      warnings,
      validationMessages,
      criteriaApplied,
    });
  }

  private recordEvent(event: StrategyOptimizationEvent): void {
    this.collectedEvents.push(Object.freeze({ ...event }));
  }
}

export type StrategyOptimizationClock = Readonly<{
  now: () => number;
  iso: () => string;
}>;

type StrategyOptimizationServiceDependencies = Readonly<{
  clock: StrategyOptimizationClock;
  performanceAnalyticsClock: PerformanceAnalyticsClock;
  executionSimulatorClock: ExecutionSimulatorClock;
  rejectOnRepeat: boolean;
}>;

function createDeterministicClock(seed: string): StrategyOptimizationClock {
  const normalized = seed.trim();
  const hash = createHash('sha256').update(normalized).digest('hex');
  const nowMs = Number.parseInt(hash.slice(0, 12), 16) % 1_000_000_000;
  const baseMs = Date.parse('2026-01-01T00:00:00.000Z');
  const iso = new Date(
    baseMs + (Number.parseInt(hash.slice(12, 20), 16) % 86_400_000),
  ).toISOString();

  return Object.freeze({
    now: () => nowMs,
    iso: () => iso,
  });
}

function deterministicAnalysisId(optimizationId: string, configurationId: string): string {
  return `${optimizationId.trim()}::${configurationId.trim()}`;
}

function applyStrategyParametersToExecutionPolicy(
  base: ExecutionPolicy,
  parameters: StrategyConfiguration['parameters'],
): ExecutionPolicy {
  const nested = isRecord(parameters.executionPolicy)
    ? (parameters.executionPolicy as Record<string, unknown>)
    : {};

  const allowPartialFill = readBoolean(parameters, nested, 'allowPartialFill');
  const deterministicSlippage = readNumber(parameters, nested, 'deterministicSlippage');
  const fixedCommission = readNumber(parameters, nested, 'fixedCommission');

  return createExecutionPolicy({
    allowPartialFill: allowPartialFill ?? base.allowPartialFill,
    deterministicSlippage: deterministicSlippage ?? base.deterministicSlippage,
    fixedCommission: fixedCommission ?? base.fixedCommission,
  });
}

function computeCustomWeightedScores(
  reports: readonly PerformanceReport[],
  weights: CustomScoreWeights,
): number[] {
  const successRates = reports.map((r) => r.executionSuccessRate);
  const slippages = reports.map((r) => r.averageSlippage);
  const totalCommissions = reports.map((r) => r.totalCommission);

  const normalizedSuccess = normalizeHigherBetter(successRates);
  const normalizedSlippage = normalizeLowerBetter(slippages);
  const normalizedCommission = normalizeLowerBetter(totalCommissions);

  return reports.map((_, i) => {
    return (
      weights.executionSuccessRate * normalizedSuccess[i]! +
      weights.averageSlippage * normalizedSlippage[i]! +
      weights.totalCommission * normalizedCommission[i]!
    );
  });
}

function normalizeHigherBetter(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const denom = max - min;
  return values.map((value) => (denom === 0 ? 1 : (value - min) / denom));
}

function normalizeLowerBetter(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const denom = max - min;
  return values.map((value) => (denom === 0 ? 1 : 1 - (value - min) / denom));
}

function readBoolean(
  root: Record<string, unknown>,
  nested: Record<string, unknown>,
  key: string,
): boolean | null {
  const value = nested[key] ?? root[key];
  return typeof value === 'boolean' ? value : null;
}

function readNumber(
  root: Record<string, unknown>,
  nested: Record<string, unknown>,
  key: string,
): number | null {
  const value = nested[key] ?? root[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
