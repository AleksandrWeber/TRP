import type { PipelineStepMetadata } from '../../pipeline-step-metadata';

/**
 * Knowledge Pipeline step metadata (US090).
 * Mirrors KnowledgeDomainService.createFromExperiment stages — no new business logic.
 */
export const KNOWLEDGE_PIPELINE_STEP_METADATA = {
  prepare: {
    stepId: 'knowledge.prepare',
    name: 'Prepare Knowledge Extraction',
    description: 'Validate experiment and resolve current version report',
    order: 1,
  },
  extract: {
    stepId: 'knowledge.extract',
    name: 'Extract Knowledge',
    description: 'Deterministically extract KnowledgeEntry fields from the report',
    order: 2,
  },
  upsert: {
    stepId: 'knowledge.upsert',
    name: 'Upsert Knowledge Entry',
    description: 'Create or update the one KnowledgeEntry per Experiment',
    order: 3,
  },
} as const satisfies Record<string, PipelineStepMetadata>;

export const KNOWLEDGE_PIPELINE_STEPS: PipelineStepMetadata[] = [
  KNOWLEDGE_PIPELINE_STEP_METADATA.prepare,
  KNOWLEDGE_PIPELINE_STEP_METADATA.extract,
  KNOWLEDGE_PIPELINE_STEP_METADATA.upsert,
];
