import { beforeEach, describe, expect, it } from 'vitest';
import { AbstractPipelineStep } from './abstract-pipeline-step';
import { LoggingPipelineHook } from './logging-pipeline-hook';
import type { Pipeline } from './pipeline';
import type { PipelineContext } from './pipeline-context';
import { PipelineExecutor } from './pipeline-executor';
import type { PipelineHook } from './pipeline-hook';
import { PipelineHookRegistry } from './pipeline-hook-registry';
import { PipelineRegistry } from './pipeline-registry';

class AppendStep extends AbstractPipelineStep {
  constructor(
    meta: { stepId: string; name: string; description: string; order: number },
    private readonly token: string,
  ) {
    super(meta);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    return {
      ...context,
      output: { ...context.output, last: this.token },
      variables: {
        ...context.variables,
        trail: [...((context.variables.trail as string[] | undefined) ?? []), this.token],
      },
    };
  }
}

class FailingStep extends AbstractPipelineStep {
  async execute(): Promise<PipelineContext> {
    throw new Error('step boom');
  }
}

function emptyContext(): PipelineContext {
  return { input: {}, output: {}, variables: {}, metadata: {} };
}

function samplePipeline(steps: Pipeline['steps']): Pipeline {
  return {
    pipelineId: 'pipe-1',
    name: 'test',
    description: 'test',
    version: '1.0.0',
    steps,
    metadata: {
      createdAt: '2026-07-17T12:00:00.000Z',
      updatedAt: '2026-07-17T12:00:00.000Z',
    },
  };
}

describe('PipelineHookRegistry (US084)', () => {
  it('registers and lists hooks', () => {
    const registry = new PipelineHookRegistry();
    const hook = new LoggingPipelineHook('log-1');
    registry.register(hook);
    expect(registry.list()).toEqual([hook]);
  });

  it('rejects duplicate hook IDs', () => {
    const registry = new PipelineHookRegistry();
    registry.register(new LoggingPipelineHook('dup'));
    expect(() => registry.register(new LoggingPipelineHook('dup'))).toThrow(
      /already registered: dup/,
    );
  });
});

describe('PipelineExecutor hooks (US084)', () => {
  let stepRegistry: PipelineRegistry;
  let hookRegistry: PipelineHookRegistry;
  let executor: PipelineExecutor;

  beforeEach(() => {
    stepRegistry = new PipelineRegistry();
    hookRegistry = new PipelineHookRegistry();
    executor = new PipelineExecutor(stepRegistry, hookRegistry);
  });

  it('calls beforePipeline', async () => {
    const calls: string[] = [];
    hookRegistry.register({
      hookId: 'h1',
      beforePipeline: () => {
        calls.push('beforePipeline');
      },
    });
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );

    await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(calls).toContain('beforePipeline');
  });

  it('calls afterPipeline', async () => {
    const calls: string[] = [];
    hookRegistry.register({
      hookId: 'h1',
      afterPipeline: () => {
        calls.push('afterPipeline');
      },
    });
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );

    await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(calls).toEqual(['afterPipeline']);
  });

  it('calls beforeStep', async () => {
    const stepIds: string[] = [];
    hookRegistry.register({
      hookId: 'h1',
      beforeStep: (step) => {
        stepIds.push((step as AbstractPipelineStep).getMetadata().stepId);
      },
    });
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );

    await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(stepIds).toEqual(['a']);
  });

  it('calls afterStep', async () => {
    const stepIds: string[] = [];
    hookRegistry.register({
      hookId: 'h1',
      afterStep: (step) => {
        stepIds.push((step as AbstractPipelineStep).getMetadata().stepId);
      },
    });
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );

    await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(stepIds).toEqual(['a']);
  });

  it('calls onError when a step throws', async () => {
    const errors: string[] = [];
    hookRegistry.register({
      hookId: 'h1',
      onError: (_step, error) => {
        errors.push(error instanceof Error ? error.message : String(error));
      },
    });
    stepRegistry.register(
      new FailingStep({ stepId: 'bad', name: 'Bad', description: '', order: 1 }),
    );

    const result = await executor.execute(
      samplePipeline([{ stepId: 'bad', name: 'Bad', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(result.success).toBe(false);
    expect(errors).toEqual(['step boom']);
  });

  it('invokes multiple hooks in registration order', async () => {
    const trail: string[] = [];
    const makeHook = (id: string): PipelineHook => ({
      hookId: id,
      beforePipeline: () => {
        trail.push(`${id}:beforePipeline`);
      },
      beforeStep: () => {
        trail.push(`${id}:beforeStep`);
      },
      afterStep: () => {
        trail.push(`${id}:afterStep`);
      },
      afterPipeline: () => {
        trail.push(`${id}:afterPipeline`);
      },
    });
    hookRegistry.register(makeHook('h1'));
    hookRegistry.register(makeHook('h2'));
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );

    await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(trail).toEqual([
      'h1:beforePipeline',
      'h2:beforePipeline',
      'h1:beforeStep',
      'h2:beforeStep',
      'h1:afterStep',
      'h2:afterStep',
      'h1:afterPipeline',
      'h2:afterPipeline',
    ]);
  });

  it('ignores hook failures and continues execution', async () => {
    hookRegistry.register({
      hookId: 'broken',
      beforePipeline: () => {
        throw new Error('hook boom');
      },
      beforeStep: () => {
        throw new Error('hook boom');
      },
      afterStep: () => {
        throw new Error('hook boom');
      },
      afterPipeline: () => {
        throw new Error('hook boom');
      },
    });
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );

    const result = await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(result.success).toBe(true);
    expect(result.context.output.last).toBe('A');
  });

  it('follows lifecycle execution order', async () => {
    const trail: string[] = [];
    hookRegistry.register({
      hookId: 'order',
      beforePipeline: () => {
        trail.push('beforePipeline');
      },
      beforeStep: (step) => {
        trail.push(`beforeStep:${(step as AbstractPipelineStep).getMetadata().stepId}`);
      },
      afterStep: (step) => {
        trail.push(`afterStep:${(step as AbstractPipelineStep).getMetadata().stepId}`);
      },
      afterPipeline: () => {
        trail.push('afterPipeline');
      },
      onError: () => {
        trail.push('onError');
      },
    });
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );
    stepRegistry.register(
      new AppendStep({ stepId: 'b', name: 'B', description: '', order: 2 }, 'B'),
    );

    await executor.execute(
      samplePipeline([
        { stepId: 'a', name: 'A', description: '', order: 1 },
        { stepId: 'b', name: 'B', description: '', order: 2 },
      ]),
      emptyContext(),
    );

    expect(trail).toEqual([
      'beforePipeline',
      'beforeStep:a',
      'afterStep:a',
      'beforeStep:b',
      'afterStep:b',
      'afterPipeline',
    ]);
  });

  it('logging hook records lifecycle', async () => {
    const logging = new LoggingPipelineHook();
    hookRegistry.register(logging);
    stepRegistry.register(
      new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'),
    );
    stepRegistry.register(
      new AppendStep({ stepId: 'b', name: 'B', description: '', order: 2 }, 'B'),
    );

    await executor.execute(
      samplePipeline([
        { stepId: 'a', name: 'A', description: '', order: 1 },
        { stepId: 'b', name: 'B', description: '', order: 2 },
      ]),
      emptyContext(),
    );

    expect(logging.records.map((r) => r.event)).toEqual([
      'beforePipeline',
      'beforeStep',
      'afterStep',
      'beforeStep',
      'afterStep',
      'afterPipeline',
    ]);
    expect(logging.records.filter((r) => r.event === 'beforeStep').map((r) => r.stepId)).toEqual([
      'a',
      'b',
    ]);
    expect(logging.records.at(-1)).toEqual({
      event: 'afterPipeline',
      success: true,
    });
  });

  it('logging hook records onError without afterPipeline', async () => {
    const logging = new LoggingPipelineHook();
    hookRegistry.register(logging);
    stepRegistry.register(
      new FailingStep({ stepId: 'bad', name: 'Bad', description: '', order: 1 }),
    );

    await executor.execute(
      samplePipeline([{ stepId: 'bad', name: 'Bad', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(logging.records.map((r) => r.event)).toEqual([
      'beforePipeline',
      'beforeStep',
      'onError',
    ]);
    expect(logging.records.at(-1)).toMatchObject({
      event: 'onError',
      stepId: 'bad',
      errorMessage: 'step boom',
    });
  });

  it('ignores onError hook failures', async () => {
    hookRegistry.register({
      hookId: 'broken-error',
      onError: () => {
        throw new Error('hook onError boom');
      },
    });
    stepRegistry.register(
      new FailingStep({ stepId: 'bad', name: 'Bad', description: '', order: 1 }),
    );

    const result = await executor.execute(
      samplePipeline([{ stepId: 'bad', name: 'Bad', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('step boom');
  });
});
