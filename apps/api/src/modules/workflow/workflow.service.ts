import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventBus } from '../events/event-bus.service';
import { ExperimentsService } from '../experiments/experiments.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../../storage/prisma/prisma.module';

type WorkflowContext = {
  datasetId?: string;
  experimentId?: string;
  knowledgeId?: string;
  approveNeedsReview?: boolean;
  [key: string]: unknown;
};

const RESEARCH_PIPELINE_STEPS = ['run_research', 'store_knowledge', 'finish'] as const;

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
    private readonly experiments: ExperimentsService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async start(input: { type: string; datasetId?: string; approveNeedsReview?: boolean }) {
    if (input.type !== 'research_pipeline') {
      throw new BadRequestException(`Unsupported workflow type: ${input.type}`);
    }
    if (!input.datasetId) {
      throw new BadRequestException('datasetId is required for research_pipeline');
    }

    const context: WorkflowContext = {
      datasetId: input.datasetId,
      approveNeedsReview: input.approveNeedsReview ?? false,
    };

    const workflow = await this.prisma.workflow.create({
      data: {
        type: input.type,
        status: 'pending',
        context: context as Prisma.InputJsonValue,
        steps: {
          create: RESEARCH_PIPELINE_STEPS.map((name, index) => ({
            name,
            stepOrder: index + 1,
            status: 'pending',
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    await this.events.publish('WorkflowStarted', { workflowId: workflow.id, type: workflow.type });
    return this.execute(workflow.id);
  }

  list() {
    return this.prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      take: 50,
    });
  }

  async get(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async cancel(id: string) {
    const workflow = await this.get(id);
    if (['completed', 'failed', 'cancelled'].includes(workflow.status)) {
      throw new BadRequestException(`Cannot cancel workflow in status ${workflow.status}`);
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date() },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    await this.events.publish('WorkflowCancelled', { workflowId: id });
    return updated;
  }

  private async execute(workflowId: string) {
    let workflow = await this.get(workflowId);
    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: { status: 'running' },
    });

    const context = { ...(workflow.context as WorkflowContext) };

    try {
      for (const step of workflow.steps) {
        workflow = await this.get(workflowId);
        if (workflow.status === 'cancelled') {
          return workflow;
        }

        await this.prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: 'running', startedAt: new Date() },
        });

        const result = await this.runStep(step.name, context, workflowId);

        await this.prisma.workflowStep.update({
          where: { id: step.id },
          data: {
            status: 'completed',
            result: result as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });

        await this.prisma.workflow.update({
          where: { id: workflowId },
          data: { context: context as Prisma.InputJsonValue },
        });
      }

      const completed = await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          context: context as Prisma.InputJsonValue,
        },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });

      await this.events.publish('WorkflowCompleted', { workflowId });
      this.logger.log(`Workflow ${workflowId} completed`);
      return completed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          status: 'failed',
          error: message,
          completedAt: new Date(),
          context: context as Prisma.InputJsonValue,
        },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });

      const runningStep = failed.steps.find((s) => s.status === 'running');
      if (runningStep) {
        await this.prisma.workflowStep.update({
          where: { id: runningStep.id },
          data: { status: 'failed', error: message, completedAt: new Date() },
        });
      }

      await this.events.publish('WorkflowFailed', { workflowId, error: message });
      this.logger.error(`Workflow ${workflowId} failed: ${message}`);
      return this.get(workflowId);
    }
  }

  private async runStep(
    name: string,
    context: WorkflowContext,
    workflowId: string,
  ): Promise<Record<string, unknown>> {
    if (name === 'run_research') {
      if (!context.datasetId) {
        throw new Error('datasetId missing in workflow context');
      }
      const experiment = await this.experiments.run(context.datasetId);
      context.experimentId = experiment.id;
      await this.events.publish('ResearchCompleted', {
        experimentId: experiment.id,
        verdict: experiment.verdict,
      });
      await this.events.publish('ValidationCompleted', {
        experimentId: experiment.id,
        verdict: experiment.verdict,
      });
      return { experimentId: experiment.id, verdict: experiment.verdict };
    }

    if (name === 'store_knowledge') {
      if (!context.experimentId) {
        throw new Error('experimentId missing before store_knowledge');
      }

      const recorded = await this.knowledge.recordFromExperiment(context.experimentId, workflowId);

      if (recorded.status === 'duplicate') {
        context.knowledgeId = recorded.existingId;
        return { knowledgeId: recorded.existingId, duplicate: true };
      }

      context.knowledgeId = recorded.entry.id;
      return { knowledgeId: recorded.entry.id };
    }

    if (name === 'finish') {
      return { done: true };
    }

    throw new Error(`Unknown step: ${name}`);
  }
}
