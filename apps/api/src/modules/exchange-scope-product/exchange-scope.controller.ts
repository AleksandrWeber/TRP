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
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  BindTradingAccountBodyDto,
  ExchangeScopeIdParamDto,
  ExchangeScopeReasonBodyDto,
  ListExchangeScopesQueryDto,
  PublishExchangeRiskPolicyBodyDto,
  RegisterExchangeScopeBodyDto,
  RenameExchangeScopeBodyDto,
  SetAdapterBindingContextBodyDto,
  TradingAccountBindingIdParamDto,
  UpdateExchangeScopeConfigBodyDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { ExchangeScopeProductService } from './exchange-scope-product.service';
import type {
  ExchangeScopeCommandView,
  ExchangeScopeDetailView,
  ExchangeScopePageView,
  ExchangeScopeWorkspaceView,
  ExchangeVenueCatalogView,
} from './exchange-scope.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-12 — HTTP transport for existing Exchange Scope service / query / consumer-read ports.
 * Does not own isolation artifacts. Does not call venue APIs. Domain `rest: false` is unchanged.
 * `GET /exchange-scopes/default` remains the existing Bot Facade overview.
 */
@Controller({ path: 'exchange-scopes', version: '1' })
export class ExchangeScopeProductController {
  constructor(
    private readonly product: ExchangeScopeProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('venues')
  listVenues(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): ExchangeVenueCatalogView {
    requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listVenues();
  }

  @Get('workspace')
  workspace(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): ExchangeScopeWorkspaceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getWorkspace(workspaceId);
  }

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListExchangeScopesQueryDto,
  ): ExchangeScopePageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listScopes(workspaceId, query.lifecycleStatus);
  }

  @Post()
  @HttpCode(201)
  create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: RegisterExchangeScopeBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.register({
        workspaceId,
        venueCode: body.venueCode,
        displayName: body.displayName,
        requestedBy: request.user.userId,
        notes: body.notes,
        maxActiveSessions: body.maxActiveSessions,
        modeContext: body.modeContext,
        requestedAt: now(),
      }),
    );
  }

  @Get(':exchangeScopeId/config')
  getConfig(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).config;
  }

  @Get(':exchangeScopeId/versions')
  getVersions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).versions;
  }

  @Get(':exchangeScopeId/policy')
  getPolicy(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).currentPolicy;
  }

  @Get(':exchangeScopeId/policies')
  getPolicies(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).policies;
  }

  @Get(':exchangeScopeId/bindings')
  getBindings(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    const detail = this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId);
    return {
      bindings: detail.bindings,
      adapterContext: detail.adapterContext,
    };
  }

  @Get(':exchangeScopeId/metadata')
  getMetadata(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).metadata;
  }

  @Get(':exchangeScopeId/history')
  getHistory(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).history;
  }

  @Get(':exchangeScopeId/lifecycle')
  getLifecycle(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ) {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId).lifecycle;
  }

  @Get(':exchangeScopeId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
  ): ExchangeScopeDetailView {
    return this.requireDetail(request.user, workspaceHeader, params.exchangeScopeId);
  }

  @Post(':exchangeScopeId/activate')
  activate(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: ExchangeScopeReasonBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.activate({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        requestedBy: request.user.userId,
        reason: body?.reason,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/suspend')
  suspend(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: ExchangeScopeReasonBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.suspend({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        requestedBy: request.user.userId,
        reason: body?.reason,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/archive')
  archive(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: ExchangeScopeReasonBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.archive({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        requestedBy: request.user.userId,
        reason: body?.reason,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/rename')
  rename(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: RenameExchangeScopeBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.rename({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        displayName: body.displayName,
        updatedBy: request.user.userId,
        asOf: now(),
      }),
    );
  }

  @Put(':exchangeScopeId/config')
  updateConfig(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: UpdateExchangeScopeConfigBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.updateConfig({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        updatedBy: request.user.userId,
        displayName: body.displayName,
        maxActiveSessions: body.maxActiveSessions,
        symbolAllowlist: body.symbolAllowlist,
        strategyAllowlist: body.strategyAllowlist,
        modeContext: body.modeContext,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/policy')
  publishPolicy(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: PublishExchangeRiskPolicyBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.publishPolicy({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        publishedBy: request.user.userId,
        limits: body.limits,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/bindings')
  bind(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: BindTradingAccountBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.bindAccount({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        tradingAccountId: body.tradingAccountId,
        requestedBy: request.user.userId,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/bindings/:bindingId/unbind')
  unbind(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: TradingAccountBindingIdParamDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.unbindAccount({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        tradingAccountBindingId: params.bindingId,
        requestedBy: request.user.userId,
        asOf: now(),
      }),
    );
  }

  @Post(':exchangeScopeId/adapter-context')
  setAdapterContext(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: ExchangeScopeIdParamDto,
    @Body() body: SetAdapterBindingContextBodyDto,
  ): ExchangeScopeCommandView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return mapCommand(
      this.product.setAdapterContext({
        workspaceId,
        exchangeScopeId: params.exchangeScopeId,
        adapterIdentity: body.adapterIdentity,
        requestedBy: request.user.userId,
        modeContext: body.modeContext,
        asOf: now(),
      }),
    );
  }

  private requireDetail(
    user: AuthUser,
    workspaceHeader: string | undefined,
    exchangeScopeId: string,
  ): ExchangeScopeDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, user, workspaceHeader);
    const detail = this.product.getScope(workspaceId, exchangeScopeId);
    if (!detail) throw new NotFoundException('Exchange Scope not found');
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

function mapCommand(result: ExchangeScopeCommandView): ExchangeScopeCommandView {
  if (result.outcome !== 'rejected') return result;
  const reasons = result.rejectionReasons;
  if (reasons.includes('scope_not_found') || reasons.includes('binding_not_found')) {
    throw new NotFoundException(reasons.join(', '));
  }
  if (
    reasons.includes('scope_id_exists') ||
    reasons.includes('active_venue_exists') ||
    reasons.includes('binding_id_exists') ||
    reasons.includes('scope_archived')
  ) {
    throw new ConflictException(reasons.join(', '));
  }
  throw new BadRequestException(reasons.join(', ') || 'Exchange Scope command rejected');
}
