import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import {
  ListRuntimeValidationHistoryQueryDto,
  RunRuntimeValidationBodyDto,
  RuntimeValidationIdParamDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { RuntimeValidationService } from './runtime-validation.service';
import {
  toRuntimeValidationHistoryView,
  toRuntimeValidationView,
  type RuntimeValidationHistoryView,
  type RuntimeValidationView,
} from './runtime-validation.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-04 — HTTP transport for existing RuntimeEnforcementPort.validateDeployment.
 * Not a new Gate. Not a new SoT. Fail-closed. No overrides.
 */
@Controller({ path: 'runtime-validations', version: '1' })
export class RuntimeValidationController {
  constructor(
    private readonly validations: RuntimeValidationService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Post()
  run(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: RunRuntimeValidationBodyDto,
  ): RuntimeValidationView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return toRuntimeValidationView(
      this.validations.run({
        workspaceId,
        libraryEntryId: body.libraryEntryId,
        strategyFamilyId: body.strategyFamilyId,
        strategyVersion: body.strategyVersion,
        exchangeScopeId: body.exchangeScopeId,
        tacticPoint: body.tacticPoint,
        purpose: body.purpose ?? 'deployment_bind',
      }),
    );
  }

  @Get()
  listHistory(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListRuntimeValidationHistoryQueryDto,
  ): RuntimeValidationHistoryView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const page = this.validations.listHistory({
      workspaceId,
      limit: query.limit,
    });
    return toRuntimeValidationHistoryView(page.items);
  }

  @Get(':validationId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: RuntimeValidationIdParamDto,
  ): RuntimeValidationView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const record = this.validations.get(params.validationId, workspaceId);
    if (!record) {
      throw new NotFoundException('Runtime validation not found');
    }
    return toRuntimeValidationView(record);
  }

  private requireWorkspace(user: AuthUser, workspaceHeader: string | undefined): string {
    const workspaceId = workspaceHeader?.trim();
    if (!workspaceId) {
      throw new BadRequestException('X-Workspace-Id header is required');
    }
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
    return workspaceId;
  }
}
