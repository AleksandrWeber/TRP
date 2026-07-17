import type { PipelineContext } from './pipeline-context';
import type { PipelineResult } from './pipeline-result';
import type { PipelineRun } from './pipeline-run';
import type { PipelineStep } from './pipeline-step';

/**
 * Optional lifecycle hooks around Pipeline execution (US084).
 * Observation/logging only — must not mutate PipelineContext.
 * Hook exceptions must not stop pipeline execution.
 */
export interface PipelineHook {
  readonly hookId: string;

  beforePipeline?(context: PipelineContext, run?: PipelineRun): void | Promise<void>;

  afterPipeline?(result: PipelineResult, run?: PipelineRun): void | Promise<void>;

  beforeStep?(
    step: PipelineStep,
    context: PipelineContext,
    run?: PipelineRun,
  ): void | Promise<void>;

  afterStep?(step: PipelineStep, context: PipelineContext, run?: PipelineRun): void | Promise<void>;

  onError?(
    step: PipelineStep | null,
    error: unknown,
    context: PipelineContext,
    run?: PipelineRun,
  ): void | Promise<void>;
}
