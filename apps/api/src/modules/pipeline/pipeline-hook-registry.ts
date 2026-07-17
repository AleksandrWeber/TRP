import type { PipelineHook } from './pipeline-hook';

/**
 * In-memory registry of PipelineHook instances (US084).
 * Rejects duplicate hook IDs. Does not invoke hooks.
 */
export class PipelineHookRegistry {
  private readonly hooks = new Map<string, PipelineHook>();

  register(hook: PipelineHook): void {
    if (this.hooks.has(hook.hookId)) {
      throw new Error(`Pipeline hook already registered: ${hook.hookId}`);
    }
    this.hooks.set(hook.hookId, hook);
  }

  list(): PipelineHook[] {
    return Array.from(this.hooks.values());
  }
}

/** Module-scoped singleton instance (no DI token). */
export const pipelineHookRegistry = new PipelineHookRegistry();
