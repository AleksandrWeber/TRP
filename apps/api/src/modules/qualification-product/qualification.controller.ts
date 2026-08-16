import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  FailQualificationRunBodyDto,
  ListQualificationRunsQueryDto,
  QualificationRunIdParamDto,
  QualificationTargetIdParamDto,
  RequestQualificationRunBodyDto,
  RequalifyQualificationRunBodyDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { QualificationProductService } from './qualification-product.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type {
  QualificationCommandView,
  QualificationConfidenceProductView,
  QualificationHealthProductView,
  QualificationHistoryItemView,
  QualificationLifecycleProductView,
  QualificationRunDetailView,
  QualificationRunPageView,
  QualificationTargetDetailView,
  QualificationTargetPageView,
  QualificationWorkspaceView,
} from './qualification.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-08 — HTTP transport for existing Market Qualification service / query ports.
 * Does not own qualification artifacts. Does not score markets. Domain `rest: false` is unchanged.
 */
@Controller({ path: 'qualification', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class QualificationProductController {
  constructor(
    private readonly product: QualificationProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('workspace')
  workspace(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): QualificationWorkspaceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getWorkspace(workspaceId);
  }

  @Get('targets')
  listTargets(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): QualificationTargetPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listTargets(workspaceId);
  }

  @Get('targets/:targetId/lifecycle')
  getLifecycle(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
  ): QualificationLifecycleProductView {
    return this.requireTarget(request.user, workspaceHeader, params.targetId).lifecycle;
  }

  @Get('targets/:targetId/confidence')
  getConfidence(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
  ): QualificationConfidenceProductView {
    const detail = this.requireTarget(request.user, workspaceHeader, params.targetId);
    if (!detail.confidence) throw new NotFoundException('Market confidence not found');
    return detail.confidence;
  }

  @Get('targets/:targetId/health')
  getHealth(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
  ): QualificationHealthProductView {
    const detail = this.requireTarget(request.user, workspaceHeader, params.targetId);
    if (!detail.health) throw new NotFoundException('Market health not found');
    return detail.health;
  }

  @Get('targets/:targetId/history')
  getHistory(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
  ): readonly QualificationHistoryItemView[] {
    return this.requireTarget(request.user, workspaceHeader, params.targetId).history;
  }

  @Get('targets/:targetId/runs')
  listTargetRuns(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
  ): QualificationRunPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    this.requireTarget(request.user, workspaceHeader, params.targetId);
    return this.product.listRuns(workspaceId, { targetId: params.targetId });
  }

  @Get('targets/:targetId')
  getTarget(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
  ): QualificationTargetDetailView {
    return this.requireTarget(request.user, workspaceHeader, params.targetId);
  }

  @RequirePermission(PermissionClass.Research)
  @Post('targets/:targetId/requalify')
  requalify(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationTargetIdParamDto,
    @Body() body: RequalifyQualificationRunBodyDto,
  ): QualificationCommandView {
    const detail = this.requireTarget(request.user, workspaceHeader, params.targetId);
    return mapCommand(
      this.product.requalify({
        workspaceId: detail.workspaceId,
        exchangeScopeId: detail.exchangeScopeId,
        marketSymbol: detail.marketSymbol,
        modeContext: body.modeContext,
        requestedBy: request.user.userId,
        notes: body.notes,
        requestedAt: now(),
      }),
    );
  }

  @Get('runs')
  listRuns(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListQualificationRunsQueryDto,
  ): QualificationRunPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listRuns(workspaceId, {
      targetId: query.targetId,
      status: query.status,
    });
  }

  @Get('runs/:qualificationRunId')
  getRun(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationRunIdParamDto,
  ): QualificationRunDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const run = this.product.getRun(workspaceId, params.qualificationRunId);
    if (!run) throw new NotFoundException('Qualification run not found');
    return run;
  }

  @RequirePermission(PermissionClass.Research)
  @Post('runs')
  @HttpCode(201)
  request(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: RequestQualificationRunBodyDto,
  ): QualificationCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.request({
        workspaceId,
        exchangeScopeId: body.exchangeScopeId,
        marketSymbol: body.marketSymbol,
        modeContext: body.modeContext,
        requestedBy: request.user.userId,
        notes: body.notes,
        requestedAt: now(),
      }),
    );
  }

  @RequirePermission(PermissionClass.Research)
  @Post('runs/:qualificationRunId/confirm')
  confirm(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationRunIdParamDto,
  ): QualificationCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.confirm({
        workspaceId,
        qualificationRunId: params.qualificationRunId,
        confirmedBy: request.user.userId,
        confirmedAt: now(),
      }),
    );
  }

  @RequirePermission(PermissionClass.Research)
  @Post('runs/:qualificationRunId/cancel')
  cancel(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationRunIdParamDto,
  ): QualificationCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.cancel({
        workspaceId,
        qualificationRunId: params.qualificationRunId,
        cancelledBy: request.user.userId,
        cancelledAt: now(),
      }),
    );
  }

  @RequirePermission(PermissionClass.Research)
  @Post('runs/:qualificationRunId/complete')
  complete(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationRunIdParamDto,
  ): QualificationCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.complete({
        workspaceId,
        qualificationRunId: params.qualificationRunId,
        completedAt: now(),
      }),
    );
  }

  @RequirePermission(PermissionClass.Research)
  @Post('runs/:qualificationRunId/fail')
  fail(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: QualificationRunIdParamDto,
    @Body() body: FailQualificationRunBodyDto,
  ): QualificationCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.fail({
        workspaceId,
        qualificationRunId: params.qualificationRunId,
        failedAt: now(),
        reasons: body.reasons,
      }),
    );
  }

  private requireTarget(
    user: AuthUser,
    workspaceHeader: string | undefined,
    targetId: string,
  ): QualificationTargetDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, user, workspaceHeader);
    const detail = this.product.getTarget(workspaceId, targetId);
    if (!detail) throw new NotFoundException('Qualification target not found');
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

function now(): string {
  return new Date().toISOString();
}

function mapCommand(result: QualificationCommandView): QualificationCommandView {
  if (result.outcome !== 'rejected') return result;
  const reasons = result.rejectionReasons;
  if (reasons.includes('run_not_found')) {
    throw new NotFoundException(reasons.join(', '));
  }
  if (reasons.includes('run_id_exists') || reasons.includes('open_run_exists')) {
    throw new ConflictException(reasons.join(', '));
  }
  throw new BadRequestException(reasons.join(', ') || 'Qualification command rejected');
}
