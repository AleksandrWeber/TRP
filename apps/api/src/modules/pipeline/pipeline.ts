import type { PipelineMetadata } from './pipeline-metadata';
import type { PipelineStepMetadata } from './pipeline-step-metadata';

/**
 * Generic Research Pipeline definition (US081–US082).
 * Stores step metadata only — never executable PipelineStep instances.
 */
export type Pipeline = {
  pipelineId: string;
  name: string;
  description: string;
  version: string;
  steps: PipelineStepMetadata[];
  metadata: PipelineMetadata;
};
