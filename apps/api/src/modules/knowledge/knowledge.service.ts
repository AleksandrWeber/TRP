import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventBus } from '../events/event-bus.service';
import { PrismaService } from '../../storage/prisma/prisma.module';

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

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
  ) {}

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
}
