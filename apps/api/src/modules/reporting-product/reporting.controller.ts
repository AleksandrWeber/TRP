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
  ListReportDefinitionsQueryDto,
  ListReportRunsQueryDto,
  ReportDefinitionIdParamDto,
  ReportRunIdParamDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { ReportingProductService } from './reporting-product.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type {
  ReportDefinitionPageView,
  ReportDefinitionView,
  ReportRunDetailView,
  ReportRunPageView,
} from './reporting.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-05 — HTTP transport for existing ReportingQueryPort.
 * Distinct from research `/v1/reports`. Queries only. No duplicated generation.
 */
@Controller({ path: 'report-runs', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class ReportingRunController {
  constructor(
    private readonly product: ReportingProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListReportRunsQueryDto,
  ): ReportRunPageView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return this.product.listRuns({
      workspaceId,
      reportDefinitionId: query.reportDefinitionId,
      kind: query.kind,
      status: query.status,
      mode: query.mode,
      tradingSessionId: query.tradingSessionId,
      q: query.q,
      limit: query.limit,
    });
  }

  @Get(':reportRunId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ReportRunIdParamDto,
  ): ReportRunDetailView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const run = this.product.getRun(workspaceId, params.reportRunId);
    if (!run) throw new NotFoundException('Report run not found');
    return run;
  }

  private requireWorkspace(user: AuthUser, workspaceHeader: string | undefined): string {
    return requireWorkspace(this.workspaceAccess, user, workspaceHeader);
  }
}

@Controller({ path: 'report-definitions', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class ReportingDefinitionController {
  constructor(
    private readonly product: ReportingProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListReportDefinitionsQueryDto,
  ): ReportDefinitionPageView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return this.product.listDefinitions(workspaceId, query.kind);
  }

  @Get(':reportDefinitionId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ReportDefinitionIdParamDto,
  ): ReportDefinitionView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const definition = this.product.getDefinition(workspaceId, params.reportDefinitionId);
    if (!definition) throw new NotFoundException('Report definition not found');
    return definition;
  }

  private requireWorkspace(user: AuthUser, workspaceHeader: string | undefined): string {
    return requireWorkspace(this.workspaceAccess, user, workspaceHeader);
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
