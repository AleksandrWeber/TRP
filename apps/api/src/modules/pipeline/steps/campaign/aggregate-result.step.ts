import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import type { Logger } from '../../../../logging/logger';
import { NoOpLogger } from '../../../../logging/noop.logger';
import type { CampaignSummary } from '../../../research-campaign/research-campaign.types';
import { readCampaignInput, readExecutionState } from './campaign-context';
import { CAMPAIGN_PIPELINE_STEP_METADATA } from './campaign-step-metadata';

/**
 * Campaign stage: assemble CampaignSummary from execution accumulators (US087).
 * Extracted from ResearchCampaignService.executeCampaign summary assembly.
 */
export class AggregateResultStep extends AbstractPipelineStep {
  private readonly logger: Logger;

  constructor(logger: Logger = new NoOpLogger()) {
    super(CAMPAIGN_PIPELINE_STEP_METADATA.aggregate);
    this.logger = logger.child(AggregateResultStep.name);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const input = readCampaignInput(context);
    const state = readExecutionState(context);

    const summary: CampaignSummary = {
      campaignId: state.campaignId,
      strategyId: input.strategyId,
      datasetId: input.datasetId,
      totalRuns: input.paramsList.length,
      passCount: state.passCount,
      failCount: state.failCount,
      needsReviewCount: state.needsReviewCount,
      bestExperimentId: state.bestExperimentId,
      createdAt: state.createdAt,
      failedRuns: state.failedRuns,
    };

    this.logger.info(
      `Campaign ${summary.campaignId} finished: ${summary.passCount} pass / ${summary.failCount} fail / ${summary.needsReviewCount} needs_review / ${state.failedRuns.length} errors`,
      { campaignId: summary.campaignId },
    );

    const output: PipelineContext['output'] = {
      ...context.output,
      summary,
      experiments: state.experiments,
    };

    if (state.sliceIdentity !== undefined) {
      output.sliceIdentity = state.sliceIdentity;
    }

    return {
      ...context,
      output,
    };
  }
}
