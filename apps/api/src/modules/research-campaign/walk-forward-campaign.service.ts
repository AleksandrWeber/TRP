import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createSliceRef, type StrategyParams } from '@trp/research';
import { ExperimentsService } from '../experiments/experiments.service';
import type { CampaignReportExperiment } from './campaign-report.types';
import { ResearchCampaignService } from './research-campaign.service';
import {
  buildWalkForwardAggregate,
  type WalkForwardAggregateWindow,
  type WalkForwardWindowMetrics,
} from './walk-forward-aggregate';
import { buildWalkForwardWindows } from './walk-forward-window-builder';
import type {
  WalkForwardCampaignRequest,
  WalkForwardCampaignSummary,
  WalkForwardWindowMetricsView,
  WalkForwardWindowResult,
} from './walk-forward-campaign.types';

type ExperimentLike = {
  id: string;
  verdict: string;
  metrics?: {
    profitFactor?: number;
    totalReturnPercent?: number;
    expectancy?: number;
    maxDrawdownPercent?: number;
  } | null;
  report?: { params?: StrategyParams } | null;
};

@Injectable()
export class WalkForwardCampaignService {
  private readonly logger = new Logger(WalkForwardCampaignService.name);

  constructor(
    private readonly campaigns: ResearchCampaignService,
    private readonly experiments: ExperimentsService,
  ) {}

  /**
   * Walk-Forward orchestration: Train campaign on train SliceRef, then evaluate
   * best train params on test SliceRef (US049). Aggregate v2: train + test blocks;
   * overallVerdict from test only (US050).
   */
  async run(request: WalkForwardCampaignRequest): Promise<WalkForwardCampaignSummary> {
    this.validate(request);

    const built = buildWalkForwardWindows(
      request.datasetLength,
      request.windowSize,
      request.stepSize,
    );

    const windows: WalkForwardWindowResult[] = [];
    const successfulForAggregate: WalkForwardAggregateWindow[] = [];
    let successfulWindows = 0;
    let failedWindows = 0;

    for (let windowIndex = 0; windowIndex < built.length; windowIndex += 1) {
      const window = built[windowIndex];
      let trainSliceIdentity: string | null = null;
      let testSliceIdentity: string | null = null;

      try {
        const train = createSliceRef({
          datasetId: request.datasetId,
          startIndex: window.trainStart,
          endIndex: window.trainEnd,
          role: 'TRAIN',
          datasetLength: request.datasetLength,
        });
        const test = createSliceRef({
          datasetId: request.datasetId,
          startIndex: window.testStart,
          endIndex: window.testEnd,
          role: 'TEST',
          datasetLength: request.datasetLength,
        });

        trainSliceIdentity = train.sliceIdentity;
        testSliceIdentity = test.sliceIdentity;

        const { summary, experiments } = await this.campaigns.run({
          datasetId: request.datasetId,
          strategyId: request.strategyId,
          paramsList: request.paramsList,
          sliceRef: train.ref,
        });

        const best = this.resolveBestExperiment(summary.bestExperimentId, experiments);
        const trainEval = this.toTrainEvaluation(best);

        const testEval = await this.evaluateOnTestSlice({
          datasetId: request.datasetId,
          strategyId: request.strategyId,
          testSliceRef: test.ref,
          best,
        });

        windows.push({
          ...window,
          summary,
          error: null,
          trainSliceIdentity,
          testSliceIdentity,
          ...trainEval,
          ...testEval,
        });
        successfulWindows += 1;
        successfulForAggregate.push({
          windowIndex,
          summary,
          metrics: this.extractMetrics(summary.bestExperimentId, experiments),
          testMetrics: testEval.testMetrics,
          testVerdict: testEval.testVerdict,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Walk-forward window train=${window.trainStart}-${window.trainEnd} failed: ${message}`,
        );
        windows.push({
          ...window,
          summary: null,
          error: message,
          trainSliceIdentity,
          testSliceIdentity,
          trainBestExperimentId: null,
          testExperimentId: null,
          trainMetrics: null,
          testMetrics: null,
          trainVerdict: null,
          testVerdict: null,
        });
        failedWindows += 1;
      }
    }

    const aggregate = buildWalkForwardAggregate(successfulForAggregate);

    return {
      datasetId: request.datasetId,
      strategyId: request.strategyId,
      windowSize: request.windowSize,
      stepSize: request.stepSize,
      paramsCount: request.paramsList.length,
      windowCount: windows.length,
      successfulWindows,
      failedWindows,
      windows,
      ...aggregate,
    };
  }

  private async evaluateOnTestSlice(input: {
    datasetId: string;
    strategyId: string;
    testSliceRef: ReturnType<typeof createSliceRef>['ref'];
    best: CampaignReportExperiment | null;
  }): Promise<{
    testExperimentId: string | null;
    testMetrics: WalkForwardWindowMetricsView | null;
    testVerdict: string | null;
  }> {
    const empty = {
      testExperimentId: null,
      testMetrics: null,
      testVerdict: null,
    };

    if (!input.best) return empty;

    const params = input.best.report?.params;
    if (!params || typeof params !== 'object') return empty;

    try {
      const experiment = (await this.experiments.run(
        input.datasetId,
        input.strategyId,
        params as StrategyParams,
        input.testSliceRef,
      )) as ExperimentLike;

      return {
        testExperimentId: experiment.id,
        testVerdict: experiment.verdict,
        testMetrics: this.metricsViewFrom(experiment.metrics),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Walk-forward test evaluation failed for slice ${input.testSliceRef.startIndex}-${input.testSliceRef.endIndex}: ${message}`,
      );
      return empty;
    }
  }

  private toTrainEvaluation(best: CampaignReportExperiment | null): {
    trainBestExperimentId: string | null;
    trainMetrics: WalkForwardWindowMetricsView | null;
    trainVerdict: string | null;
  } {
    if (!best) {
      return {
        trainBestExperimentId: null,
        trainMetrics: null,
        trainVerdict: null,
      };
    }

    return {
      trainBestExperimentId: best.id,
      trainVerdict: best.verdict,
      trainMetrics: this.metricsViewFrom(best.metrics),
    };
  }

  private resolveBestExperiment(
    bestExperimentId: string | null,
    experiments: CampaignReportExperiment[],
  ): CampaignReportExperiment | null {
    if (experiments.length === 0) return null;

    if (bestExperimentId) {
      const byId = experiments.find((experiment) => experiment.id === bestExperimentId);
      if (byId) return byId;
    }

    let best: CampaignReportExperiment | null = null;
    let bestPf = Number.NEGATIVE_INFINITY;
    for (const experiment of experiments) {
      const pf = experiment.metrics?.profitFactor;
      if (typeof pf === 'number' && pf > bestPf) {
        bestPf = pf;
        best = experiment;
      }
    }
    return best;
  }

  private metricsViewFrom(
    metrics:
      | {
          profitFactor?: number;
          totalReturnPercent?: number;
          maxDrawdownPercent?: number;
          expectancy?: number;
        }
      | null
      | undefined,
  ): WalkForwardWindowMetricsView {
    return {
      profitFactor: asNumber(metrics?.profitFactor),
      totalReturnPercent: asNumber(metrics?.totalReturnPercent),
      maxDrawdownPercent: asNumber(metrics?.maxDrawdownPercent),
      expectancy: asNumber(metrics?.expectancy),
    };
  }

  private extractMetrics(
    bestExperimentId: string | null,
    experiments: CampaignReportExperiment[],
  ): WalkForwardWindowMetrics {
    const best = this.resolveBestExperiment(bestExperimentId, experiments);
    if (!best) {
      return {
        profitFactor: null,
        totalReturnPercent: null,
        maxDrawdownPercent: null,
        expectancy: null,
      };
    }
    return this.metricsViewFrom(best.metrics);
  }

  private validate(request: WalkForwardCampaignRequest): void {
    if (!request.datasetId) {
      throw new BadRequestException('datasetId is required');
    }
    if (!request.strategyId) {
      throw new BadRequestException('strategyId is required');
    }
    if (!Array.isArray(request.paramsList) || request.paramsList.length === 0) {
      throw new BadRequestException('paramsList must be a non-empty array');
    }
    if (!Number.isFinite(request.windowSize) || request.windowSize <= 0) {
      throw new BadRequestException('windowSize must be a positive number');
    }
    if (!Number.isFinite(request.stepSize) || request.stepSize <= 0) {
      throw new BadRequestException('stepSize must be a positive number');
    }
    if (!Number.isFinite(request.datasetLength) || request.datasetLength <= 0) {
      throw new BadRequestException('datasetLength must be a positive number');
    }
  }
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}
