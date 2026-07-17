import type { PipelineContext } from './pipeline-context';
import type { PipelineRunStatus } from './pipeline-run-status';

/**
 * Single execution instance of a Pipeline (US081).
 * In-memory only — lifecycle updated by PipelineExecutor (no persistence).
 */
export type PipelineRun = {
  runId: string;
  pipelineId: string;
  startedAt: string;
  finishedAt?: string;
  status: PipelineRunStatus;
  context: PipelineContext;
};
