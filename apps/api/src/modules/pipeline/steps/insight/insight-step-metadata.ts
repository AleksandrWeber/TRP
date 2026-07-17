import type { PipelineStepMetadata } from '../../pipeline-step-metadata';

/**
 * Insight Pipeline step metadata (US096).
 * Deterministic Insight extraction from Knowledge — no AI / LLM.
 */
export const INSIGHT_PIPELINE_STEP_METADATA = {
  prepare: {
    stepId: 'insights.prepare',
    name: 'Prepare Insight Extraction',
    description: 'Collect session, experiment, and Knowledge references for extraction',
    order: 1,
  },
  extract: {
    stepId: 'insights.extract',
    name: 'Extract Insights',
    description: 'Deterministically create Insight drafts from Knowledge entries',
    order: 2,
  },
  persist: {
    stepId: 'insights.persist',
    name: 'Persist Insights',
    description: 'Store generated Insights via InsightDomainService',
    order: 3,
  },
} as const satisfies Record<string, PipelineStepMetadata>;

export const INSIGHT_PIPELINE_STEPS: PipelineStepMetadata[] = [
  INSIGHT_PIPELINE_STEP_METADATA.prepare,
  INSIGHT_PIPELINE_STEP_METADATA.extract,
  INSIGHT_PIPELINE_STEP_METADATA.persist,
];
