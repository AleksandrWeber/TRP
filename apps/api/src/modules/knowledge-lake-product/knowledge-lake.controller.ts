import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import {
  KnowledgeLakeEntryIdParamDto,
  ListKnowledgeLakeQueryDto,
  KnowledgeLakeEntryQueryDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { KnowledgeLakeProductService } from './knowledge-lake-product.service';
import type {
  KnowledgeLakeDetailView,
  KnowledgeLakeHistoryPageView,
  KnowledgeLakePageView,
  KnowledgeLakeProvenanceView,
  KnowledgeLakeRelationshipPageView,
  ListKnowledgeLakeQuery,
} from './knowledge-lake.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-16 — HTTP transport for existing KnowledgeLakeQueryPort.
 * Distinct from research `/v1/knowledge`. Queries only. No admission.
 */
@Controller({ path: 'knowledge-lake', version: '1' })
export class KnowledgeLakeProductController {
  constructor(
    private readonly product: KnowledgeLakeProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('search')
  search(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListKnowledgeLakeQueryDto,
  ): KnowledgeLakePageView {
    return this.product.search(this.toQuery(request.user, workspaceHeader, query));
  }

  @Get('relationships')
  relationships(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: KnowledgeLakeEntryQueryDto,
  ): KnowledgeLakeRelationshipPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const entryId = query.entryId?.trim();
    if (!entryId) throw new BadRequestException('entryId is required');
    const page = this.product.relationships(workspaceId, entryId);
    if (!page) throw new NotFoundException('Knowledge Lake entry not found');
    return page;
  }

  @Get('history')
  history(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListKnowledgeLakeQueryDto,
  ): KnowledgeLakeHistoryPageView {
    return this.product.history(this.toQuery(request.user, workspaceHeader, query));
  }

  @Get('provenance')
  provenance(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: KnowledgeLakeEntryQueryDto,
  ): KnowledgeLakeProvenanceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const entryId = query.entryId?.trim();
    if (!entryId) throw new BadRequestException('entryId is required');
    const provenance = this.product.provenance(workspaceId, entryId);
    if (!provenance) throw new NotFoundException('Knowledge Lake entry not found');
    return provenance;
  }

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListKnowledgeLakeQueryDto,
  ): KnowledgeLakePageView {
    return this.product.list(this.toQuery(request.user, workspaceHeader, query));
  }

  @Get(':entryId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: KnowledgeLakeEntryIdParamDto,
  ): KnowledgeLakeDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const detail = this.product.get(workspaceId, params.entryId);
    if (!detail) throw new NotFoundException('Knowledge Lake entry not found');
    return detail;
  }

  private toQuery(
    user: AuthUser,
    workspaceHeader: string | undefined,
    query: ListKnowledgeLakeQueryDto,
  ): ListKnowledgeLakeQuery {
    const workspaceId = requireWorkspace(this.workspaceAccess, user, workspaceHeader);
    return {
      workspaceId,
      ...(query.q ? { q: query.q } : {}),
      ...(query.producer ? { producer: query.producer } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.libraryEntryId ? { libraryEntryId: query.libraryEntryId } : {}),
      ...(query.reportRunId ? { reportRunId: query.reportRunId } : {}),
      ...(query.tradingSessionId ? { tradingSessionId: query.tradingSessionId } : {}),
      ...(query.exchangeScopeId ? { exchangeScopeId: query.exchangeScopeId } : {}),
      ...(query.correlationId ? { correlationId: query.correlationId } : {}),
      ...(query.occurredFrom ? { occurredFrom: query.occurredFrom } : {}),
      ...(query.occurredTo ? { occurredTo: query.occurredTo } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
    };
  }
}

function requireWorkspace(
  access: WorkspaceAccessService,
  user: AuthUser,
  workspaceHeader: string | undefined,
): string {
  const workspaceId = workspaceHeader?.trim();
  if (!workspaceId) {
    throw new BadRequestException('X-Workspace-Id header is required');
  }
  try {
    access.assertMember(workspaceId, user.userId);
  } catch {
    throw new ForbiddenException('workspace access denied');
  }
  return workspaceId;
}
