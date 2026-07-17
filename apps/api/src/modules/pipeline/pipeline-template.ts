import type { PipelineMetadata } from './pipeline-metadata';

/**
 * Reusable Pipeline Template definition (US085).
 * References a blueprint Pipeline via pipelineId — step metadata lives on that Pipeline.
 * Templates are immutable; createPipelineFromTemplate yields independent copies.
 */
export type PipelineTemplate = {
  templateId: string;
  name: string;
  description: string;
  version: string;
  pipelineId: string;
  defaultMetadata: PipelineTemplateDefaultMetadata;
};

export type PipelineTemplateDefaultMetadata = Partial<
  Omit<PipelineMetadata, 'createdAt' | 'updatedAt'>
>;
