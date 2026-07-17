import { beforeEach, describe, expect, it } from 'vitest';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineRunStatus } from './pipeline-run-status';

describe('PipelineDomainService (US081)', () => {
  let service: PipelineDomainService;

  beforeEach(() => {
    service = new PipelineDomainService();
  });

  it('creates a pipeline', () => {
    const pipeline = service.createPipeline({
      name: 'research-campaign',
      description: 'Generic campaign execution skeleton',
      version: '1.0.0',
      steps: [
        { stepId: 'prepare', name: 'prepare', description: 'Prepare', order: 1 },
        { stepId: 'run', name: 'run', description: 'Run', order: 2 },
      ],
      metadata: { author: 'trp', version: 'meta-1' },
    });

    expect(pipeline.pipelineId.length).toBeGreaterThan(0);
    expect(pipeline.name).toBe('research-campaign');
    expect(pipeline.description).toBe('Generic campaign execution skeleton');
    expect(pipeline.version).toBe('1.0.0');
    expect(pipeline.steps).toEqual([
      { stepId: 'prepare', name: 'prepare', description: 'Prepare', order: 1 },
      { stepId: 'run', name: 'run', description: 'Run', order: 2 },
    ]);
    expect(pipeline.metadata.author).toBe('trp');
    expect(pipeline.metadata.version).toBe('meta-1');
    expect(pipeline.metadata.createdAt).toEqual(expect.any(String));
    expect(pipeline.metadata.updatedAt).toEqual(expect.any(String));
  });

  it('lists pipelines', () => {
    const a = service.createPipeline({ name: 'a' });
    const b = service.createPipeline({ name: 'b' });

    expect(service.listPipelines().map((p) => p.pipelineId)).toEqual([a.pipelineId, b.pipelineId]);
  });

  it('gets a pipeline by id', () => {
    const created = service.createPipeline({ name: 'lookup' });

    expect(service.getPipeline(created.pipelineId)).toBe(created);
    expect(service.getPipeline('missing')).toBeNull();
  });

  it('creates a run in PENDING status', () => {
    const pipeline = service.createPipeline({ name: 'runnable' });
    const run = service.createRun({
      pipelineId: pipeline.pipelineId,
      input: { datasetId: 'ds-1' },
      variables: { seed: 1 },
      metadata: { source: 'test' },
    });

    expect(run).not.toBeNull();
    expect(run!.runId.length).toBeGreaterThan(0);
    expect(run!.pipelineId).toBe(pipeline.pipelineId);
    expect(run!.status).toBe(PipelineRunStatus.PENDING);
    expect(run!.startedAt).toEqual(expect.any(String));
    expect(run!.finishedAt).toBeUndefined();
  });

  it('initializes generic context on createRun', () => {
    const pipeline = service.createPipeline({ name: 'ctx' });
    const input = { foo: 'bar' };
    const run = service.createRun({
      pipelineId: pipeline.pipelineId,
      input,
      variables: { x: 1 },
      metadata: { y: 'z' },
    })!;

    expect(run.context).toEqual({
      input: { foo: 'bar' },
      output: {},
      variables: { x: 1 },
      metadata: { y: 'z' },
    });
    input.foo = 'mutated';
    expect(run.context.input.foo).toBe('bar');
  });

  it('returns null when creating a run for unknown pipeline', () => {
    expect(service.createRun({ pipelineId: 'missing' })).toBeNull();
  });

  it('gets a run by id', () => {
    const pipeline = service.createPipeline({ name: 'get-run' });
    const run = service.createRun({ pipelineId: pipeline.pipelineId })!;

    expect(service.getRun(run.runId)).toBe(run);
    expect(service.getRun('missing')).toBeNull();
  });

  it('lists runs and filters by pipelineId', () => {
    const a = service.createPipeline({ name: 'a' });
    const b = service.createPipeline({ name: 'b' });
    const runA = service.createRun({ pipelineId: a.pipelineId })!;
    const runB = service.createRun({ pipelineId: b.pipelineId })!;

    expect(service.listRuns().map((r) => r.runId)).toEqual([runA.runId, runB.runId]);
    expect(service.listRuns(a.pipelineId).map((r) => r.runId)).toEqual([runA.runId]);
  });

  it('defaults empty description, steps, and metadata timestamps', () => {
    const pipeline = service.createPipeline({ name: 'minimal' });

    expect(pipeline.description).toBe('');
    expect(pipeline.version).toBe('1.0.0');
    expect(pipeline.steps).toEqual([]);
    expect(pipeline.metadata.createdAt).toBeDefined();
    expect(pipeline.metadata.updatedAt).toBeDefined();
  });

  it('exposes PipelineRunStatus enum', () => {
    expect(Object.values(PipelineRunStatus)).toEqual([
      'PENDING',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ]);
  });
});
