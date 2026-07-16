import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventBus } from '../events/event-bus.service';
import { PrismaService } from '../../storage/prisma/prisma.module';
import {
  buildConfigIdentityKey,
  buildDedupeKey,
  buildResearchPayload,
  isLegacyKnowledgePayload,
} from './knowledge.helpers';
import {
  KNOWLEDGE_SCHEMA_VERSION,
  RESEARCH_ENGINE_VERSION,
  VALIDATION_VERSION,
} from './knowledge.version';

export type CreateKnowledgeInput = {
  type: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  validationStatus: string;
  workflowId?: string;
  experimentId?: string;
  authorEmail?: string;
  payload: Record<string, unknown>;
  parentId?: string;
};

export type RecordExperimentResult =
  | { status: 'created'; entry: Awaited<ReturnType<KnowledgeService['get']>> }
  | { status: 'duplicate'; existingId: string };

export type BackfillResult = {
  created: number;
  pass: number;
  fail: number;
  needs_review: number;
  duplicatesSkipped: number;
};

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
  ) {}

  private getResearchEngineVersion(): string {
    return process.env.RESEARCH_ENGINE_VERSION ?? RESEARCH_ENGINE_VERSION;
  }

  private getValidationVersion(): string {
    return process.env.VALIDATION_VERSION ?? VALIDATION_VERSION;
  }

  async create(input: CreateKnowledgeInput) {
    if (!['pass', 'needs_review'].includes(input.validationStatus)) {
      throw new Error('Only pass or needs_review knowledge may be stored');
    }

    let version = 1;
    if (input.parentId) {
      const parent = await this.prisma.knowledgeEntry.findUnique({ where: { id: input.parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent knowledge ${input.parentId} not found`);
      }
      version = parent.version + 1;
    }

    const entry = await this.prisma.knowledgeEntry.create({
      data: {
        type: input.type,
        title: input.title,
        description: input.description,
        category: input.category,
        tags: input.tags ?? [],
        version,
        parentId: input.parentId,
        validationStatus: input.validationStatus,
        workflowId: input.workflowId,
        experimentId: input.experimentId,
        authorEmail: input.authorEmail,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Knowledge created ${entry.id}`);
    await this.events.publish('KnowledgeCreated', { knowledgeId: entry.id, type: entry.type });
    return entry;
  }

  async recordFromExperiment(
    experimentId: string,
    workflowId?: string,
  ): Promise<RecordExperimentResult> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        dataset: {
          select: {
            symbol: true,
            timeframe: true,
            barCount: true,
            contentHash: true,
          },
        },
      },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    const params = (experiment.report as { params?: Record<string, unknown> })?.params ?? {};
    const metrics = experiment.metrics as Record<string, unknown>;
    const validation = experiment.validation as Record<string, unknown>;

    const researchEngineVersion = this.getResearchEngineVersion();
    const validationVersion = this.getValidationVersion();
    const knowledgeSchemaVersion = KNOWLEDGE_SCHEMA_VERSION;

    const configIdentityKey = buildConfigIdentityKey(
      experiment.strategyId,
      experiment.datasetId,
      experiment.configHash,
    );

    const resultIdentityDedupeKey = buildDedupeKey(
      experiment.strategyId,
      experiment.datasetId,
      experiment.configHash,
      researchEngineVersion,
      validationVersion,
    );

    // Deduplication is based on the composite result identity.
    const existing = await this.findByDedupeKey(resultIdentityDedupeKey);
    if (existing) {
      this.logger.debug(
        `Knowledge duplicate skipped for experiment ${experimentId} (${resultIdentityDedupeKey})`,
      );
      return { status: 'duplicate', existingId: existing.id };
    }

    const legacyExisting = await this.findLegacyDuplicate(configIdentityKey);
    if (legacyExisting) {
      this.logger.debug(
        `Knowledge legacy duplicate skipped for experiment ${experimentId} (${configIdentityKey})`,
      );
      return { status: 'duplicate', existingId: legacyExisting.id };
    }

    // Immutable lineage:
    // new knowledge points to the previous one by config identity (no updates to old records).
    const priorKnowledge = await this.findLatestByConfigIdentityKey(configIdentityKey);
    const supersedesKnowledgeId = priorKnowledge?.id;

    const payload = buildResearchPayload({
      strategyId: experiment.strategyId,
      params,
      datasetId: experiment.datasetId,
      configHash: experiment.configHash,
      researchEngineVersion,
      validationVersion,
      knowledgeSchemaVersion,
      gitCommit: experiment.gitCommit,
      metrics,
      validation,
      verdict: experiment.verdict,
      dataset: experiment.dataset,
      experimentCreatedAt: experiment.createdAt,
      supersedesKnowledgeId,
    });

    const entry = await this.prisma.knowledgeEntry.create({
      data: {
        type: 'research_outcome',
        title: `${experiment.strategyId} · ${experiment.dataset.symbol} ${experiment.dataset.timeframe}`,
        description: payload.conclusion,
        category: 'Experiment',
        tags: [
          experiment.dataset.symbol,
          experiment.strategyId,
          experiment.strategyId.toUpperCase(),
          experiment.verdict,
        ],
        validationStatus: experiment.verdict,
        workflowId,
        experimentId: experiment.id,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Research knowledge created ${entry.id} from experiment ${experimentId}`);
    await this.events.publish('KnowledgeCreated', { knowledgeId: entry.id, type: entry.type });
    await this.events.publish('KnowledgeStored', { knowledgeId: entry.id, experimentId });
    return { status: 'created', entry };
  }

  async backfillFromExperiments(): Promise<BackfillResult> {
    const experiments = await this.prisma.experiment.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const result: BackfillResult = {
      created: 0,
      pass: 0,
      fail: 0,
      needs_review: 0,
      duplicatesSkipped: 0,
    };

    for (const experiment of experiments) {
      const recorded = await this.recordFromExperiment(experiment.id);
      if (recorded.status === 'duplicate') {
        result.duplicatesSkipped += 1;
        continue;
      }

      result.created += 1;
      const verdict = recorded.entry.validationStatus;
      if (verdict === 'pass') result.pass += 1;
      else if (verdict === 'fail') result.fail += 1;
      else if (verdict === 'needs_review') result.needs_review += 1;
    }

    this.logger.log(
      `Knowledge backfill complete: ${result.created} created, ${result.duplicatesSkipped} duplicates skipped`,
    );
    return result;
  }

  async get(id: string) {
    const entry = await this.prisma.knowledgeEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Knowledge ${id} not found`);
    }
    return entry;
  }

  search(query?: { q?: string; type?: string; category?: string; tag?: string }) {
    const where: Record<string, unknown> = {};
    if (query?.type) where.type = query.type;
    if (query?.category) where.category = query.category;
    if (query?.tag) where.tags = { has: query.tag };
    if (query?.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.knowledgeEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private findByDedupeKey(dedupeKey: string) {
    return this.prisma.knowledgeEntry.findFirst({
      where: {
        type: 'research_outcome',
        payload: {
          path: ['dedupeKey'],
          equals: dedupeKey,
        },
      },
    });
  }

  private findLatestByConfigIdentityKey(configIdentityKey: string) {
    // Prefer the new payload field; fall back to legacy dedupeKey.
    return this.prisma.knowledgeEntry
      .findFirst({
        where: {
          type: 'research_outcome',
          payload: {
            path: ['configIdentityKey'],
            equals: configIdentityKey,
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .then(async (found) => {
        if (found) return found;
        return this.findLegacyDuplicate(configIdentityKey, { newestFirst: true });
      });
  }

  private async findLegacyDuplicate(
    configIdentityKey: string,
    options?: { newestFirst?: boolean },
  ) {
    const candidates = await this.prisma.knowledgeEntry.findMany({
      where: {
        type: 'research_outcome',
        payload: {
          path: ['dedupeKey'],
          equals: configIdentityKey,
        },
      },
      orderBy: { createdAt: options?.newestFirst ? 'desc' : 'asc' },
    });

    return (
      candidates.find((candidate) =>
        isLegacyKnowledgePayload(candidate.payload as Record<string, unknown>),
      ) ?? null
    );
  }

  async getLineage(id: string) {
    const current = await this.get(id);
    const payload = current.payload as Record<string, unknown>;
    const supersedesKnowledgeId =
      typeof payload.supersedesKnowledgeId === 'string' ? payload.supersedesKnowledgeId : null;

    const supersededBy = await this.prisma.knowledgeEntry.findMany({
      where: {
        type: 'research_outcome',
        payload: {
          path: ['supersedesKnowledgeId'],
          equals: id,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    });

    return {
      knowledgeId: current.id,
      supersedesKnowledgeId,
      supersededByKnowledgeIds: supersededBy.map((entry) => entry.id),
    };
  }
}
