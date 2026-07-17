import { beforeEach, describe, expect, it } from 'vitest';
import { AbstractPipelineStep } from './abstract-pipeline-step';
import type { PipelineContext } from './pipeline-context';
import { PipelineRegistry } from './pipeline-registry';

class EchoStep extends AbstractPipelineStep {
  async execute(context: PipelineContext): Promise<PipelineContext> {
    return {
      ...context,
      output: { ...context.output, echoed: true },
    };
  }
}

class NoopStep extends AbstractPipelineStep {
  async execute(context: PipelineContext): Promise<PipelineContext> {
    return context;
  }
}

describe('PipelineRegistry (US082)', () => {
  let registry: PipelineRegistry;

  beforeEach(() => {
    registry = new PipelineRegistry();
  });

  it('registers a step', () => {
    const step = new EchoStep({
      stepId: 'echo',
      name: 'Echo',
      description: 'Echoes context',
      order: 1,
    });

    registry.register(step);

    expect(registry.get('echo')).toBe(step);
  });

  it('rejects duplicate registration', () => {
    const meta = {
      stepId: 'dup',
      name: 'Dup',
      description: 'x',
      order: 0,
    };
    registry.register(new EchoStep(meta));

    expect(() => registry.register(new NoopStep(meta))).toThrow(
      /Pipeline step already registered: dup/,
    );
  });

  it('gets a step by id', () => {
    const step = new NoopStep({
      stepId: 'noop',
      name: 'Noop',
      description: 'no-op',
      order: 2,
    });
    registry.register(step);

    expect(registry.get('noop')).toBe(step);
    expect(registry.get('missing')).toBeNull();
  });

  it('lists registered steps', () => {
    const a = new EchoStep({
      stepId: 'a',
      name: 'A',
      description: 'a',
      order: 1,
    });
    const b = new NoopStep({
      stepId: 'b',
      name: 'B',
      description: 'b',
      order: 2,
    });
    registry.register(a);
    registry.register(b);

    expect(registry.list()).toEqual([a, b]);
  });

  it('exposes metadata from abstract steps', () => {
    const step = new EchoStep({
      stepId: 'meta-step',
      name: 'Meta',
      description: 'Has metadata',
      order: 3,
    });

    expect(step.getMetadata()).toEqual({
      stepId: 'meta-step',
      name: 'Meta',
      description: 'Has metadata',
      order: 3,
    });
  });

  it('enforces abstract execute contract', async () => {
    const step = new EchoStep({
      stepId: 'echo-2',
      name: 'Echo',
      description: 'd',
      order: 1,
    });
    const context: PipelineContext = {
      input: { v: 1 },
      output: {},
      variables: {},
      metadata: {},
    };

    const next = await step.execute(context);

    expect(next.output).toEqual({ echoed: true });
    expect(next.input).toEqual({ v: 1 });
  });
});
