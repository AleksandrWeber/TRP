import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pipeline } from './pipeline';
import type { PipelineContext } from './pipeline-context';
import type { PipelineMetadata } from './pipeline-metadata';
import type { PipelineRun } from './pipeline-run';
import { PipelineRunStatus } from './pipeline-run-status';
import type { PipelineStepMetadata } from './pipeline-step-metadata';

export type CreatePipelineInput = {
  name: string;
  description?: string;
  version?: string;
  steps?: PipelineStepMetadata[];
  metadata?: Partial<Omit<PipelineMetadata, 'createdAt' | 'updatedAt'>>;
};

export type CreatePipelineRunInput = {
  pipelineId: string;
  input?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * In-memory Pipeline domain service (US081–US082).
 * create / get / list for Pipeline and PipelineRun — no Repository or HTTP.
 */
@Injectable()
export class PipelineDomainService {
  private readonly pipelines = new Map<string, Pipeline>();
  private readonly runs = new Map<string, PipelineRun>();

  createPipeline(input: CreatePipelineInput): Pipeline {
    const now = new Date().toISOString();
    const pipeline: Pipeline = {
      pipelineId: randomUUID(),
      name: input.name,
      description: input.description ?? '',
      version: input.version ?? '1.0.0',
      steps: cloneStepMetadata(input.steps),
      metadata: {
        createdAt: now,
        updatedAt: now,
        ...(input.metadata?.version !== undefined ? { version: input.metadata.version } : {}),
        ...(input.metadata?.author !== undefined ? { author: input.metadata.author } : {}),
      },
    };

    this.pipelines.set(pipeline.pipelineId, pipeline);
    return pipeline;
  }

  getPipeline(pipelineId: string): Pipeline | null {
    return this.pipelines.get(pipelineId) ?? null;
  }

  listPipelines(): Pipeline[] {
    return Array.from(this.pipelines.values());
  }

  createRun(input: CreatePipelineRunInput): PipelineRun | null {
    const pipeline = this.pipelines.get(input.pipelineId);
    if (!pipeline) return null;

    const run: PipelineRun = {
      runId: randomUUID(),
      pipelineId: input.pipelineId,
      startedAt: new Date().toISOString(),
      status: PipelineRunStatus.PENDING,
      context: createEmptyContext(input),
    };

    this.runs.set(run.runId, run);
    return run;
  }

  getRun(runId: string): PipelineRun | null {
    return this.runs.get(runId) ?? null;
  }

  listRuns(pipelineId?: string): PipelineRun[] {
    const all = Array.from(this.runs.values());
    if (pipelineId === undefined) return all;
    return all.filter((run) => run.pipelineId === pipelineId);
  }
}

function createEmptyContext(input: CreatePipelineRunInput): PipelineContext {
  return {
    input: cloneRecord(input.input),
    output: {},
    variables: cloneRecord(input.variables),
    metadata: cloneRecord(input.metadata),
  };
}

function cloneStepMetadata(steps?: PipelineStepMetadata[]): PipelineStepMetadata[] {
  if (!steps) return [];
  return steps.map((step) => ({
    stepId: step.stepId,
    name: step.name,
    description: step.description,
    order: step.order,
  }));
}

function cloneRecord(value?: Record<string, unknown>): Record<string, unknown> {
  return value ? { ...value } : {};
}
