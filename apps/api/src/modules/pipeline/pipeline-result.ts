import type { PipelineContext } from './pipeline-context';

/**
 * Outcome of a finished PipelineRun (US081).
 * Reserved for future executor — not produced by domain service yet.
 */
export type PipelineResult = {
  success: boolean;
  context: PipelineContext;
  duration: number;
  error?: string;
};
