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
  ListMarketStateHistoryQueryDto,
  MarketStateTargetIdParamDto,
  MarketStateVersionParamDto,
  RefreshMarketStateBodyDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { MarketStateProductService } from './market-state-product.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type {
  MarketStateDetailView,
  MarketStateLifecycleView,
  MarketStateMetadataView,
  MarketStatePageView,
  MarketStateProfileReferenceView,
  MarketStateQualificationReferenceView,
  MarketStateRefreshView,
  MarketStateTargetDetailView,
  MarketStateTransitionPageView,
  MarketStateVersionPageView,
  MarketStateWorkspaceView,
} from './market-state.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-10 — HTTP transport for existing Market State query/refresh surfaces.
 * Does not own Market State. Does not classify. Domain `rest: false` is unchanged.
 */
@Controller({ path: 'market-states', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class MarketStateProductController {
  constructor(
    private readonly product: MarketStateProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('workspace')
  workspace(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): MarketStateWorkspaceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getWorkspace(workspaceId);
  }

  @Get('history')
  history(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListMarketStateHistoryQueryDto,
  ): MarketStateVersionPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listHistory(workspaceId, query.targetId);
  }

  @Get()
  listCurrent(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): MarketStatePageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listCurrent(workspaceId);
  }

  @Get('targets/:targetId/current')
  getCurrent(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateDetailView {
    return this.requireCurrent(request.user, workspaceHeader, params.targetId);
  }

  @Get('targets/:targetId/lifecycle')
  getLifecycle(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateLifecycleView {
    return this.requireCurrent(request.user, workspaceHeader, params.targetId).lifecycle;
  }

  @Get('targets/:targetId/transitions')
  listTransitions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateTransitionPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const page = this.product.listTransitions(workspaceId, params.targetId);
    if (!page) throw new NotFoundException('Market State not found');
    return page;
  }

  @Get('targets/:targetId/versions/:version/metadata')
  getMetadata(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateVersionParamDto,
  ): MarketStateMetadataView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const metadata = this.product.getMetadata(workspaceId, params.targetId, params.version);
    if (!metadata) throw new NotFoundException('Market State version not found');
    return metadata;
  }

  @Get('targets/:targetId/versions/:version')
  getVersion(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateVersionParamDto,
  ): MarketStateDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const detail = this.product.getVersion(workspaceId, params.targetId, params.version);
    if (!detail) throw new NotFoundException('Market State version not found');
    return detail;
  }

  @Get('targets/:targetId/versions')
  listVersions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateVersionPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    this.requireCurrent(request.user, workspaceHeader, params.targetId);
    return this.product.listHistory(workspaceId, params.targetId);
  }

  @Get('targets/:targetId/qualification')
  getQualification(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateQualificationReferenceView {
    return this.requireCurrent(request.user, workspaceHeader, params.targetId).qualification;
  }

  @Get('targets/:targetId/profile')
  getProfile(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateProfileReferenceView {
    return this.requireCurrent(request.user, workspaceHeader, params.targetId).profile;
  }

  @RequirePermission(PermissionClass.Research)
  @Post('targets/:targetId/refresh')
  refresh(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
    @Body() body: RefreshMarketStateBodyDto,
  ): MarketStateRefreshView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const refreshed = this.product.refresh(
      workspaceId,
      params.targetId,
      request.user.userId,
      body.notes,
    );
    if (!refreshed) throw new NotFoundException('Market State not found');
    return refreshed;
  }

  @Get('targets/:targetId')
  getTarget(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketStateTargetIdParamDto,
  ): MarketStateTargetDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const detail = this.product.getTarget(workspaceId, params.targetId);
    if (!detail) throw new NotFoundException('Market State not found');
    return detail;
  }

  private requireCurrent(
    user: AuthUser,
    workspaceHeader: string | undefined,
    targetId: string,
  ): MarketStateDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, user, workspaceHeader);
    const detail = this.product.getCurrent(workspaceId, targetId);
    if (!detail) throw new NotFoundException('Market State not found');
    return detail;
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
