import type { AbstractPipelineStep } from './abstract-pipeline-step';
import type { PipelineStep } from './pipeline-step';

/**
 * In-memory registry of executable PipelineStep instances (US082).
 * Singleton within PipelineModule — no custom DI tokens yet.
 * Does not execute steps.
 */
export class PipelineRegistry {
  private readonly steps = new Map<string, AbstractPipelineStep>();

  register(step: AbstractPipelineStep): void {
    const { stepId } = step.getMetadata();
    if (this.steps.has(stepId)) {
      throw new Error(`Pipeline step already registered: ${stepId}`);
    }
    this.steps.set(stepId, step);
  }

  get(stepId: string): PipelineStep | null {
    return this.steps.get(stepId) ?? null;
  }

  list(): AbstractPipelineStep[] {
    return Array.from(this.steps.values());
  }
}

/** Module-scoped singleton instance (no DI token). */
export const pipelineRegistry = new PipelineRegistry();
