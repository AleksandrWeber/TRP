import type { PipelineContext } from './pipeline-context';
import type { PipelineStep } from './pipeline-step';
import type { PipelineStepMetadata } from './pipeline-step-metadata';

/**
 * Base class for Pipeline steps (US082).
 * Exposes metadata; subclasses must implement execute().
 * No execution orchestration here.
 */
export abstract class AbstractPipelineStep implements PipelineStep {
  constructor(private readonly stepMetadata: PipelineStepMetadata) {}

  getMetadata(): PipelineStepMetadata {
    return { ...this.stepMetadata };
  }

  abstract execute(context: PipelineContext): Promise<PipelineContext>;
}
