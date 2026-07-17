import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { CreateKnowledgeBodyDto, IdParamDto, ListKnowledgeQueryDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import type { KnowledgeEntry } from './knowledge-entry';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeService } from './knowledge.service';

/**
 * Knowledge HTTP API.
 * GET /knowledge → in-memory KnowledgeEntry search (US079), scoped by X-Workspace-Id (US109).
 * Other routes remain Prisma research_outcome (legacy) — not workspace-scoped.
 */
@Controller({ path: 'knowledge', version: '1' })
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly domain: KnowledgeDomainService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  /**
   * Read-only domain search (US079).
   * Optional `q` / `tag` / `experimentId` with AND semantics.
   * Always 200 — empty array when nothing matches.
   */
  @Get()
  list(
    @Query() query: ListKnowledgeQueryDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): KnowledgeEntry[] {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.domain.find(query, workspaceId);
  }

  @Post('backfill')
  backfill() {
    return this.knowledgeService.backfillFromExperiments();
  }

  @Get(':id')
  get(@Param() params: IdParamDto) {
    return this.knowledgeService.get(params.id);
  }

  @Post()
  create(@Body() body: CreateKnowledgeBodyDto) {
    return this.knowledgeService.create(body);
  }
}
