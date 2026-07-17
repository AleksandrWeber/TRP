import { Injectable } from '@nestjs/common';
import type { Pipeline } from './pipeline';
import type { PipelineContext } from './pipeline-context';
import type { PipelineHook } from './pipeline-hook';
import type { PipelineHookRegistry } from './pipeline-hook-registry';
import type { PipelineResult } from './pipeline-result';
import type { PipelineRun } from './pipeline-run';
import { PipelineRunStatus } from './pipeline-run-status';
import type { PipelineRegistry } from './pipeline-registry';
import type { PipelineStep } from './pipeline-step';
import type { PipelineStepMetadata } from './pipeline-step-metadata';

/**
 * Executes Pipeline definitions via registered PipelineSteps (US083–US084).
 * Resolves steps by metadata.order; invokes optional lifecycle hooks; updates optional PipelineRun.
 */
@Injectable()
export class PipelineExecutor {
  constructor(
    private readonly registry: PipelineRegistry,
    private readonly hookRegistry: PipelineHookRegistry,
  ) {}

  /**
   * @param run Optional in-memory run updated PENDING→RUNNING→COMPLETED|FAILED
   */
  async execute(
    pipeline: Pipeline,
    context: PipelineContext,
    run?: PipelineRun,
  ): Promise<PipelineResult> {
    const startedAt = Date.now();
    let current = cloneContext(context);
    let failedStep: PipelineStep | null = null;

    if (run) {
      run.status = PipelineRunStatus.RUNNING;
      run.context = current;
    }

    await this.invokeHooks((hook) => hook.beforePipeline?.(current, run));

    try {
      for (const meta of orderSteps(pipeline.steps)) {
        const step = this.registry.get(meta.stepId);
        if (!step) {
          throw new Error(`Pipeline step not registered: ${meta.stepId}`);
        }

        await this.invokeHooks((hook) => hook.beforeStep?.(step, current, run));

        try {
          current = await step.execute(current);
        } catch (error) {
          failedStep = step;
          await this.invokeHooks((hook) => hook.onError?.(step, error, current, run));
          throw error;
        }

        if (run) {
          run.context = current;
        }

        await this.invokeHooks((hook) => hook.afterStep?.(step, current, run));
      }

      const duration = Date.now() - startedAt;
      if (run) {
        run.status = PipelineRunStatus.COMPLETED;
        run.finishedAt = new Date().toISOString();
        run.context = current;
      }

      const result: PipelineResult = {
        success: true,
        context: current,
        duration,
      };

      await this.invokeHooks((hook) => hook.afterPipeline?.(result, run));

      return result;
    } catch (error) {
      const duration = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);

      if (failedStep === null) {
        await this.invokeHooks((hook) => hook.onError?.(null, error, current, run));
      }

      if (run) {
        run.status = PipelineRunStatus.FAILED;
        run.finishedAt = new Date().toISOString();
        run.context = current;
      }

      return {
        success: false,
        context: current,
        duration,
        error: message,
      };
    }
  }

  /**
   * Invokes a hook method on every registered hook.
   * Hook exceptions are caught and ignored so they never stop the pipeline.
   */
  private async invokeHooks(invoke: (hook: PipelineHook) => void | Promise<void>): Promise<void> {
    for (const hook of this.hookRegistry.list()) {
      try {
        await invoke(hook);
      } catch {
        // Hook failures must not stop pipeline execution.
      }
    }
  }
}

/**
 * Strict order by metadata.order; ties broken deterministically by stepId.
 */
function orderSteps(steps: PipelineStepMetadata[]): PipelineStepMetadata[] {
  return [...steps].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.stepId.localeCompare(b.stepId);
  });
}

function cloneContext(context: PipelineContext): PipelineContext {
  return {
    input: { ...context.input },
    output: { ...context.output },
    variables: { ...context.variables },
    metadata: { ...context.metadata },
  };
}
