import type { PipelineContext } from './pipeline-context';

/**
 * Generic execution contract for Research Pipeline steps (US082).
 * Implementations must be registered in PipelineRegistry — Pipeline stores metadata only.
 */
export interface PipelineStep {
  execute(context: PipelineContext): Promise<PipelineContext>;
}
