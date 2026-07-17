import type { PipelineStepMetadata } from '../../pipeline-step-metadata';

/**
 * Campaign Pipeline step metadata (US087).
 * Mirrors ResearchCampaignService stages — no new business logic.
 */
export const CAMPAIGN_PIPELINE_STEP_METADATA = {
  prepare: {
    stepId: 'campaign.prepare',
    name: 'Prepare Campaign',
    description: 'Initialize campaign id, timestamps, and slice identity',
    order: 1,
  },
  execute: {
    stepId: 'campaign.execute',
    name: 'Execute Research',
    description: 'Run experiments for each parameter set',
    order: 2,
  },
  aggregate: {
    stepId: 'campaign.aggregate',
    name: 'Aggregate Results',
    description: 'Build campaign summary from experiment outcomes',
    order: 3,
  },
  buildReport: {
    stepId: 'campaign.build-report',
    name: 'Build Report',
    description: 'Build campaign report from summary and experiments',
    order: 4,
  },
  persist: {
    stepId: 'campaign.persist',
    name: 'Persist Session',
    description: 'Persist campaign session when enabled',
    order: 5,
  },
} as const satisfies Record<string, PipelineStepMetadata>;

export const CAMPAIGN_PIPELINE_STEPS: PipelineStepMetadata[] = [
  CAMPAIGN_PIPELINE_STEP_METADATA.prepare,
  CAMPAIGN_PIPELINE_STEP_METADATA.execute,
  CAMPAIGN_PIPELINE_STEP_METADATA.aggregate,
  CAMPAIGN_PIPELINE_STEP_METADATA.buildReport,
  CAMPAIGN_PIPELINE_STEP_METADATA.persist,
];
