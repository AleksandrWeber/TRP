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
  CompareMarketProfileQueryDto,
  ListMarketProfileHistoryQueryDto,
  MarketProfileTargetIdParamDto,
  MarketProfileVersionParamDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { MarketProfileProductService } from './market-profile-product.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type {
  MarketProfileCompareView,
  MarketProfileDetailView,
  MarketProfileDimensionsView,
  MarketProfileMetadataView,
  MarketProfilePageView,
  MarketProfilePublishedSourceView,
  MarketProfileTargetDetailView,
  MarketProfileVersionPageView,
  MarketProfileWorkspaceView,
} from './market-profile.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-09 — HTTP transport for existing Market Profile query ports.
 * Does not own profile versions. Does not publish. Domain `rest: false` is unchanged.
 */
@Controller({ path: 'market-profiles', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class MarketProfileProductController {
  constructor(
    private readonly product: MarketProfileProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('workspace')
  workspace(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): MarketProfileWorkspaceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getWorkspace(workspaceId);
  }

  @Get('history')
  history(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListMarketProfileHistoryQueryDto,
  ): MarketProfileVersionPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listHistory(workspaceId, query.targetId);
  }

  @Get()
  listLatest(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): MarketProfilePageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listLatest(workspaceId);
  }

  @Get('targets/:targetId/latest')
  getLatest(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileTargetIdParamDto,
  ): MarketProfileDetailView {
    return this.requireLatest(request.user, workspaceHeader, params.targetId);
  }

  @Get('targets/:targetId/versions/:version/metadata')
  getMetadata(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileVersionParamDto,
  ): MarketProfileMetadataView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const metadata = this.product.getMetadata(workspaceId, params.targetId, params.version);
    if (!metadata) throw new NotFoundException('Market Profile version not found');
    return metadata;
  }

  @Get('targets/:targetId/versions/:version/dimensions')
  getDimensions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileVersionParamDto,
  ): MarketProfileDimensionsView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const dimensions = this.product.getDimensions(workspaceId, params.targetId, params.version);
    if (!dimensions) throw new NotFoundException('Market Profile version not found');
    return dimensions;
  }

  @Get('targets/:targetId/versions/:version')
  getVersion(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileVersionParamDto,
  ): MarketProfileDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const detail = this.product.getVersion(workspaceId, params.targetId, params.version);
    if (!detail) throw new NotFoundException('Market Profile version not found');
    return detail;
  }

  @Get('targets/:targetId/versions')
  listVersions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileTargetIdParamDto,
  ): MarketProfileVersionPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    this.requireLatest(request.user, workspaceHeader, params.targetId);
    return this.product.listHistory(workspaceId, params.targetId);
  }

  @Get('targets/:targetId/published-source')
  getPublishedSource(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileTargetIdParamDto,
  ): MarketProfilePublishedSourceView {
    return this.requireLatest(request.user, workspaceHeader, params.targetId).publishedSource;
  }

  @Get('targets/:targetId/compare')
  compare(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileTargetIdParamDto,
    @Query() query: CompareMarketProfileQueryDto,
  ): MarketProfileCompareView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const compared = this.product.compare(
      workspaceId,
      params.targetId,
      query.fromVersion,
      query.toVersion,
    );
    if (!compared) throw new NotFoundException('Market Profile versions not found');
    return compared;
  }

  @Get('targets/:targetId')
  getTarget(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: MarketProfileTargetIdParamDto,
  ): MarketProfileTargetDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const detail = this.product.getTarget(workspaceId, params.targetId);
    if (!detail) throw new NotFoundException('Market Profile not found');
    return detail;
  }

  private requireLatest(
    user: AuthUser,
    workspaceHeader: string | undefined,
    targetId: string,
  ): MarketProfileDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, user, workspaceHeader);
    const detail = this.product.getLatest(workspaceId, targetId);
    if (!detail) throw new NotFoundException('Market Profile not found');
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
