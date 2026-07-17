import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { KnowledgeEntry } from './knowledge-entry';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeService } from './knowledge.service';

/**
 * Knowledge HTTP API.
 * GET /knowledge → in-memory KnowledgeEntry search (US079).
 * Other routes remain Prisma research_outcome (legacy).
 */
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly domain: KnowledgeDomainService,
  ) {}

  /**
   * Read-only domain search (US079).
   * Optional `q` / `tag` / `experimentId` with AND semantics.
   * Always 200 — empty array when nothing matches.
   */
  @Get()
  list(
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('experimentId') experimentId?: string,
  ): KnowledgeEntry[] {
    return this.domain.find({ q, tag, experimentId });
  }

  @Post('backfill')
  backfill() {
    return this.knowledgeService.backfillFromExperiments();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.knowledgeService.get(id);
  }

  @Post()
  create(
    @Body()
    body: {
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
    },
  ) {
    return this.knowledgeService.create(body);
  }
}
