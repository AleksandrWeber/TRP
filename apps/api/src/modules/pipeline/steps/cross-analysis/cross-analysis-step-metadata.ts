import type { PipelineStepMetadata } from '../../pipeline-step-metadata';

/**
 * Cross-Campaign Analysis Pipeline step metadata (US097).
 */
export const CROSS_ANALYSIS_PIPELINE_STEP_METADATA = {
  prepare: {
    stepId: 'cross-analysis.prepare',
    name: 'Prepare Cross-Campaign Analysis',
    description: 'Collect CampaignSessions, Knowledge, Insights, and experiment refs',
    order: 1,
  },
  compare: {
    stepId: 'cross-analysis.compare',
    name: 'Compare Campaigns',
    description: 'Deterministically compare campaigns and produce findings',
    order: 2,
  },
  persist: {
    stepId: 'cross-analysis.persist',
    name: 'Persist Cross-Campaign Insights',
    description: 'Store generated Insights via InsightDomainService',
    order: 3,
  },
} as const satisfies Record<string, PipelineStepMetadata>;

export const CROSS_ANALYSIS_PIPELINE_STEPS: PipelineStepMetadata[] = [
  CROSS_ANALYSIS_PIPELINE_STEP_METADATA.prepare,
  CROSS_ANALYSIS_PIPELINE_STEP_METADATA.compare,
  CROSS_ANALYSIS_PIPELINE_STEP_METADATA.persist,
];
