import type { PipelineContext } from './pipeline-context';

/**
 * Outcome of a single PipelineStep execution (US082).
 * Reserved for future executor — not produced yet.
 */
export type PipelineStepResult = {
  success: boolean;
  context: PipelineContext;
  duration: number;
  error?: string;
};
