import { randomUUID } from 'node:crypto';
import { buildSliceIdentity } from '@trp/research';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readCampaignInput, writeExecutionState } from './campaign-context';
import { CAMPAIGN_PIPELINE_STEP_METADATA } from './campaign-step-metadata';

/**
 * Campaign stage: initialize campaign identity and empty accumulators (US087).
 * Extracted from ResearchCampaignService.executeCampaign prelude.
 */
export class PrepareCampaignStep extends AbstractPipelineStep {
  constructor() {
    super(CAMPAIGN_PIPELINE_STEP_METADATA.prepare);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const input = readCampaignInput(context);
    const sliceRef = input.sliceRef;
    const sliceIdentity = sliceRef
      ? buildSliceIdentity(
          sliceRef.datasetId,
          sliceRef.startIndex,
          sliceRef.endIndex,
          sliceRef.role,
        )
      : undefined;

    return writeExecutionState(context, {
      campaignId: randomUUID(),
      createdAt: new Date().toISOString(),
      sliceIdentity,
      passCount: 0,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: null,
      bestProfitFactor: Number.NEGATIVE_INFINITY,
      failedRuns: [],
      experiments: [],
    });
  }
}
