import { Logger } from '@nestjs/common';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import type { ExperimentsService } from '../../../experiments/experiments.service';
import type { CampaignReportExperiment } from '../../../research-campaign/campaign-report.types';
import { readCampaignInput, readExecutionState, writeExecutionState } from './campaign-context';
import { CAMPAIGN_PIPELINE_STEP_METADATA } from './campaign-step-metadata';

type ExperimentLike = {
  id: string;
  verdict: string;
  metrics?: {
    profitFactor?: number;
    totalReturnPercent?: number;
    expectancy?: number;
    maxDrawdownPercent?: number;
  } | null;
  report?: { params?: Record<string, unknown>; sliceIdentity?: string } | null;
};

/**
 * Campaign stage: run experiments for each params set (US087).
 * Extracted from ResearchCampaignService.executeCampaign param loop.
 */
export class ExecuteResearchStep extends AbstractPipelineStep {
  private readonly logger = new Logger(ExecuteResearchStep.name);

  constructor(private readonly experiments: ExperimentsService) {
    super(CAMPAIGN_PIPELINE_STEP_METADATA.execute);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const input = readCampaignInput(context);
    const state = readExecutionState(context);
    const sliceRef = input.sliceRef;

    let passCount = state.passCount;
    let failCount = state.failCount;
    let needsReviewCount = state.needsReviewCount;
    let bestExperimentId = state.bestExperimentId;
    let bestProfitFactor = state.bestProfitFactor;
    const failedRuns = [...state.failedRuns];
    const experiments: CampaignReportExperiment[] = [...state.experiments];

    for (const params of input.paramsList) {
      try {
        const experiment = (await this.experiments.run(
          input.datasetId,
          input.strategyId,
          params,
          sliceRef,
        )) as ExperimentLike;

        experiments.push({
          id: experiment.id,
          verdict: experiment.verdict,
          metrics: experiment.metrics ?? null,
          report: experiment.report ?? { params },
        });

        if (experiment.verdict === 'pass') passCount += 1;
        else if (experiment.verdict === 'needs_review') needsReviewCount += 1;
        else failCount += 1;

        const profitFactor = experiment.metrics?.profitFactor;
        if (typeof profitFactor === 'number' && profitFactor > bestProfitFactor) {
          bestProfitFactor = profitFactor;
          bestExperimentId = experiment.id;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Campaign ${state.campaignId} run failed for params ${JSON.stringify(params)}: ${message}`,
        );
        failedRuns.push({ params, error: message });
      }
    }

    return writeExecutionState(context, {
      ...state,
      passCount,
      failCount,
      needsReviewCount,
      bestExperimentId,
      bestProfitFactor,
      failedRuns,
      experiments,
    });
  }
}
