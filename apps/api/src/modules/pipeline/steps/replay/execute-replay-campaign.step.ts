import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import type { ResearchCampaignService } from '../../../research-campaign/research-campaign.service';
import { readReplayExecutionState, writeReplayExecutionState } from './replay-pipeline-context';
import { REPLAY_PIPELINE_STEP_METADATA } from './replay-step-metadata';

/**
 * Replay stage: re-run campaign via ResearchCampaignService (US089).
 * Extracted from CampaignReplayService.execute campaign run (persistSession: false).
 */
export class ExecuteReplayCampaignStep extends AbstractPipelineStep {
  constructor(private readonly campaigns: ResearchCampaignService) {
    super(REPLAY_PIPELINE_STEP_METADATA.execute);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const state = readReplayExecutionState(context);
    const { campaignConfig } = state;

    if (campaignConfig.paramsList.length === 0) {
      return writeReplayExecutionState(context, {
        executeFailed: true,
      });
    }

    try {
      const campaignResult = await this.campaigns.run(
        {
          datasetId: campaignConfig.datasetId,
          strategyId: campaignConfig.strategyId,
          paramsList: campaignConfig.paramsList,
        },
        { persistSession: false },
      );

      return writeReplayExecutionState(context, {
        campaignResult,
        executeFailed: false,
      });
    } catch {
      return writeReplayExecutionState(context, {
        executeFailed: true,
      });
    }
  }
}
