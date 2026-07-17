import type { PipelineHook } from './pipeline-hook';
import type { PipelineResult } from './pipeline-result';
import type { PipelineStep } from './pipeline-step';

export type PipelineHookLifecycleEvent =
  'beforePipeline' | 'afterPipeline' | 'beforeStep' | 'afterStep' | 'onError';

export type PipelineHookRecord = {
  event: PipelineHookLifecycleEvent;
  stepId?: string;
  errorMessage?: string;
  success?: boolean;
};

/**
 * Reference PipelineHook that records lifecycle calls in memory (US084).
 * No console output — intended for tests and observation.
 */
export class LoggingPipelineHook implements PipelineHook {
  readonly hookId: string;
  readonly records: PipelineHookRecord[] = [];

  constructor(hookId = 'logging') {
    this.hookId = hookId;
  }

  clear(): void {
    this.records.length = 0;
  }

  beforePipeline(): void {
    this.records.push({ event: 'beforePipeline' });
  }

  afterPipeline(result: PipelineResult): void {
    this.records.push({
      event: 'afterPipeline',
      success: result.success,
    });
  }

  beforeStep(step: PipelineStep): void {
    this.records.push({
      event: 'beforeStep',
      stepId: stepIdOf(step),
    });
  }

  afterStep(step: PipelineStep): void {
    this.records.push({
      event: 'afterStep',
      stepId: stepIdOf(step),
    });
  }

  onError(step: PipelineStep | null, error: unknown): void {
    this.records.push({
      event: 'onError',
      stepId: step ? stepIdOf(step) : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

function stepIdOf(step: PipelineStep): string | undefined {
  const candidate = step as unknown as { getMetadata?: () => { stepId: string } };
  if (typeof candidate.getMetadata === 'function') {
    return candidate.getMetadata().stepId;
  }
  return undefined;
}
