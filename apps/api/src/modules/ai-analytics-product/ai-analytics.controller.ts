import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  AiAnalyticsIdParamDto,
  AiAnalyticsProvenanceQueryDto,
  GenerateAiAnalyticsBodyDto,
  ListAiAnalyticsQueryDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { AiAnalyticsProductService } from './ai-analytics-product.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type {
  AiAnalyticsDetailView,
  AiAnalyticsHistoryPageView,
  AiAnalyticsPageView,
  AiAnalyticsProductKind,
  AiAnalyticsProvenanceView,
  ListAiAnalyticsQuery,
} from './ai-analytics.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-17 — HTTP transport for existing AIAnalyticsPort.
 * Distinct from research `/v1/ai/execute`. Generation is narrative only.
 * No persistence. No report / knowledge / strategy writes.
 */
@Controller({ path: 'ai-analytics', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class AiAnalyticsProductController {
  constructor(
    private readonly product: AiAnalyticsProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @RequirePermission(PermissionClass.Research)
  @Post('generate')
  generate(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: GenerateAiAnalyticsBodyDto,
  ): AiAnalyticsDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.generate({
      workspaceId,
      ...(body.kind ? { kind: body.kind } : {}),
      ...(body.reportRunId ? { reportRunId: body.reportRunId } : {}),
      ...(body.compareReportRunId ? { compareReportRunId: body.compareReportRunId } : {}),
      ...(body.libraryEntryId ? { libraryEntryId: body.libraryEntryId } : {}),
      ...(body.compareLibraryEntryId ? { compareLibraryEntryId: body.compareLibraryEntryId } : {}),
      ...(body.focus !== undefined ? { focus: body.focus } : {}),
    });
  }

  @Get('history')
  history(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListAiAnalyticsQueryDto,
  ): AiAnalyticsHistoryPageView {
    return this.product.history(this.toQuery(request.user, workspaceHeader, query));
  }

  @Get('provenance')
  provenance(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: AiAnalyticsProvenanceQueryDto,
  ): AiAnalyticsProvenanceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const analysisId = query.analysisId?.trim();
    if (!analysisId) throw new BadRequestException('analysisId is required');
    const provenance = this.product.provenance(workspaceId, analysisId);
    if (!provenance) throw new NotFoundException('AI analysis not found');
    return provenance;
  }

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListAiAnalyticsQueryDto,
  ): AiAnalyticsPageView {
    return this.product.list(this.toQuery(request.user, workspaceHeader, query));
  }

  @Get(':analysisId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: AiAnalyticsIdParamDto,
  ): AiAnalyticsDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const detail = this.product.get(workspaceId, params.analysisId);
    if (!detail) throw new NotFoundException('AI analysis not found');
    return detail;
  }

  private toQuery(
    user: AuthUser,
    workspaceHeader: string | undefined,
    query: ListAiAnalyticsQueryDto,
  ): ListAiAnalyticsQuery {
    const workspaceId = requireWorkspace(this.workspaceAccess, user, workspaceHeader);
    return {
      workspaceId,
      ...(query.q ? { q: query.q } : {}),
      ...(query.kind ? { kind: query.kind as AiAnalyticsProductKind } : {}),
      ...(query.reportRunId ? { reportRunId: query.reportRunId } : {}),
      ...(query.libraryEntryId ? { libraryEntryId: query.libraryEntryId } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
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
