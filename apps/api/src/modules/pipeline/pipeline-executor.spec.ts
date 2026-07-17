import { beforeEach, describe, expect, it } from 'vitest';
import { AbstractPipelineStep } from './abstract-pipeline-step';
import { NoOpMetrics } from '../../metrics/noop.metrics';
import type { Pipeline } from './pipeline';
import type { PipelineContext } from './pipeline-context';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineExecutor } from './pipeline-executor';
import { PipelineHookRegistry } from './pipeline-hook-registry';
import { PipelineRegistry } from './pipeline-registry';
import { PipelineRunStatus } from './pipeline-run-status';

class AppendStep extends AbstractPipelineStep {
  constructor(
    meta: { stepId: string; name: string; description: string; order: number },
    private readonly token: string,
  ) {
    super(meta);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const trail = Array.isArray(context.variables.trail)
      ? [...(context.variables.trail as string[])]
      : [];
    trail.push(this.token);
    return {
      ...context,
      variables: { ...context.variables, trail },
      output: { ...context.output, last: this.token },
    };
  }
}

class FailingStep extends AbstractPipelineStep {
  async execute(): Promise<PipelineContext> {
    throw new Error('step boom');
  }
}

function emptyContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    input: {},
    output: {},
    variables: {},
    metadata: {},
    ...overrides,
  };
}

function samplePipeline(steps: Pipeline['steps']): Pipeline {
  return {
    pipelineId: 'pipe-1',
    name: 'test',
    description: 'test pipeline',
    version: '1.0.0',
    steps,
    metadata: {
      createdAt: '2026-07-17T12:00:00.000Z',
      updatedAt: '2026-07-17T12:00:00.000Z',
    },
  };
}

describe('PipelineExecutor (US083)', () => {
  let registry: PipelineRegistry;
  let hookRegistry: PipelineHookRegistry;
  let executor: PipelineExecutor;
  let domain: PipelineDomainService;

  beforeEach(() => {
    registry = new PipelineRegistry();
    hookRegistry = new PipelineHookRegistry();
    executor = new PipelineExecutor(registry, hookRegistry, new NoOpMetrics());
    domain = new PipelineDomainService();
  });

  it('executes a single step', async () => {
    registry.register(new AppendStep({ stepId: 'a', name: 'A', description: 'a', order: 1 }, 'A'));
    const pipeline = samplePipeline([{ stepId: 'a', name: 'A', description: 'a', order: 1 }]);

    const result = await executor.execute(pipeline, emptyContext());

    expect(result.success).toBe(true);
    expect(result.context.output.last).toBe('A');
    expect(result.error).toBeUndefined();
  });

  it('executes multiple steps ordered by metadata.order', async () => {
    registry.register(
      new AppendStep({ stepId: 'second', name: 'Second', description: '', order: 2 }, '2'),
    );
    registry.register(
      new AppendStep({ stepId: 'first', name: 'First', description: '', order: 1 }, '1'),
    );
    registry.register(
      new AppendStep({ stepId: 'third', name: 'Third', description: '', order: 3 }, '3'),
    );

    const pipeline = samplePipeline([
      { stepId: 'third', name: 'Third', description: '', order: 3 },
      { stepId: 'first', name: 'First', description: '', order: 1 },
      { stepId: 'second', name: 'Second', description: '', order: 2 },
    ]);

    const result = await executor.execute(pipeline, emptyContext());

    expect(result.success).toBe(true);
    expect(result.context.variables.trail).toEqual(['1', '2', '3']);
  });

  it('propagates context across steps', async () => {
    registry.register(new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'));
    registry.register(new AppendStep({ stepId: 'b', name: 'B', description: '', order: 2 }, 'B'));

    const result = await executor.execute(
      samplePipeline([
        { stepId: 'a', name: 'A', description: '', order: 1 },
        { stepId: 'b', name: 'B', description: '', order: 2 },
      ]),
      emptyContext({ input: { seed: 7 } }),
    );

    expect(result.context.input.seed).toBe(7);
    expect(result.context.variables.trail).toEqual(['A', 'B']);
    expect(result.context.output.last).toBe('B');
  });

  it('fails when a step is missing from the registry', async () => {
    const result = await executor.execute(
      samplePipeline([{ stepId: 'missing', name: 'Missing', description: '', order: 1 }]),
      emptyContext(),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not registered: missing/);
  });

  it('handles duplicate order deterministically by stepId', async () => {
    registry.register(
      new AppendStep({ stepId: 'b-step', name: 'B', description: '', order: 1 }, 'B'),
    );
    registry.register(
      new AppendStep({ stepId: 'a-step', name: 'A', description: '', order: 1 }, 'A'),
    );

    const result = await executor.execute(
      samplePipeline([
        { stepId: 'b-step', name: 'B', description: '', order: 1 },
        { stepId: 'a-step', name: 'A', description: '', order: 1 },
      ]),
      emptyContext(),
    );

    expect(result.success).toBe(true);
    expect(result.context.variables.trail).toEqual(['A', 'B']);
  });

  it('stops when a step throws and returns failed result', async () => {
    registry.register(
      new AppendStep({ stepId: 'ok', name: 'Ok', description: '', order: 1 }, 'OK'),
    );
    registry.register(new FailingStep({ stepId: 'bad', name: 'Bad', description: '', order: 2 }));
    registry.register(
      new AppendStep({ stepId: 'skip', name: 'Skip', description: '', order: 3 }, 'SKIP'),
    );

    const result = await executor.execute(
      samplePipeline([
        { stepId: 'ok', name: 'Ok', description: '', order: 1 },
        { stepId: 'bad', name: 'Bad', description: '', order: 2 },
        { stepId: 'skip', name: 'Skip', description: '', order: 3 },
      ]),
      emptyContext(),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('step boom');
    expect(result.context.variables.trail).toEqual(['OK']);
    expect(result.context.output.last).toBe('OK');
  });

  it('transitions run status PENDING → RUNNING → COMPLETED', async () => {
    registry.register(new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'));
    const pipeline = domain.createPipeline({
      name: 'run-ok',
      steps: [{ stepId: 'a', name: 'A', description: '', order: 1 }],
    });
    const run = domain.createRun({ pipelineId: pipeline.pipelineId })!;
    expect(run.status).toBe(PipelineRunStatus.PENDING);

    const result = await executor.execute(pipeline, emptyContext(), run);

    expect(result.success).toBe(true);
    expect(run.status).toBe(PipelineRunStatus.COMPLETED);
    expect(run.finishedAt).toEqual(expect.any(String));
    expect(run.context.output.last).toBe('A');
  });

  it('transitions run status to FAILED when a step throws', async () => {
    registry.register(new FailingStep({ stepId: 'bad', name: 'Bad', description: '', order: 1 }));
    const pipeline = domain.createPipeline({
      name: 'run-fail',
      steps: [{ stepId: 'bad', name: 'Bad', description: '', order: 1 }],
    });
    const run = domain.createRun({ pipelineId: pipeline.pipelineId })!;

    const result = await executor.execute(pipeline, emptyContext(), run);

    expect(result.success).toBe(false);
    expect(run.status).toBe(PipelineRunStatus.FAILED);
    expect(run.finishedAt).toEqual(expect.any(String));
  });

  it('populates duration on success and failure', async () => {
    registry.register(new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'));
    const ok = await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext(),
    );
    expect(ok.duration).toEqual(expect.any(Number));
    expect(ok.duration).toBeGreaterThanOrEqual(0);

    const fail = await executor.execute(
      samplePipeline([{ stepId: 'missing', name: 'M', description: '', order: 1 }]),
      emptyContext(),
    );
    expect(fail.duration).toEqual(expect.any(Number));
    expect(fail.duration).toBeGreaterThanOrEqual(0);
  });

  it('returns successful PipelineResult shape', async () => {
    registry.register(new AppendStep({ stepId: 'a', name: 'A', description: '', order: 1 }, 'A'));
    const result = await executor.execute(
      samplePipeline([{ stepId: 'a', name: 'A', description: '', order: 1 }]),
      emptyContext({ input: { x: 1 } }),
    );

    expect(result).toEqual({
      success: true,
      context: expect.objectContaining({
        input: { x: 1 },
        output: { last: 'A' },
      }),
      duration: expect.any(Number),
    });
  });

  it('returns failed PipelineResult shape', async () => {
    registry.register(new FailingStep({ stepId: 'bad', name: 'Bad', description: '', order: 1 }));
    const result = await executor.execute(
      samplePipeline([{ stepId: 'bad', name: 'Bad', description: '', order: 1 }]),
      emptyContext({ variables: { keep: true } }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('step boom');
    expect(result.context.variables.keep).toBe(true);
    expect(result.duration).toEqual(expect.any(Number));
  });
});
