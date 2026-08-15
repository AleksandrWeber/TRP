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
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CancelOrchestrationRunBodyDto,
  CreateOrchestrationPlanBodyDto,
  EmitSessionHandoffBodyDto,
  ListOrchestrationHistoryQueryDto,
  OrchestrationPlanIdParamDto,
  OrchestrationRunIdParamDto,
  ProposeSelectionBodyDto,
  RequestOrchestrationRunBodyDto,
  SelectionDecisionIdParamDto,
  SessionHandoffIntentIdParamDto,
} from '../../validation/dto/orchestration.dto';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { WorkspaceAccessService } from '../workspace';
import { isOrchestrationRejectedError } from './orchestration-rejected.error';
import { TradingOrchestratorProductService } from './trading-orchestrator-product.service';
import {
  toOrchestrationHistoryView,
  toOrchestrationPlanListView,
  type OrchestrationCommandView,
  type OrchestrationHistoryView,
  type OrchestrationPlanListView,
  type OrchestrationPlanView,
  type OrchestrationRunDetailView,
} from './trading-orchestrator.view';
import type {
  SelectionDecisionView,
  SessionHandoffIntentView,
} from './ports/trading-orchestrator.port';

type RequestWithUser = { user: AuthUser };

/**
 * PC-11 — HTTP transport for existing Trading Orchestrator service/query ports.
 * Coordination only. Never creates Session, Orders, Execution, or Risk approvals.
 */
@Controller({ path: 'orchestrations', version: '1' })
export class TradingOrchestratorController {
  constructor(
    private readonly product: TradingOrchestratorProductService,
    private readonly commandAuthorization: CommandAuthorizationService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Post('plans')
  @Roles(Role.Trader, Role.Admin)
  createPlan(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: CreateOrchestrationPlanBodyDto,
  ): OrchestrationPlanView {
    const context = this.authorizeCommand(request.user, workspaceHeader);
    return this.product.createPlan({
      workspaceId: context.workspaceId,
      requestedBy: context.actorId,
      marketSymbol: body.marketSymbol,
      exchangeScopeId: body.exchangeScopeId,
      modeContext: body.modeContext,
      objective: body.objective,
      rationaleSummary: body.rationaleSummary,
    });
  }

  @Get('plans')
  listPlans(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): OrchestrationPlanListView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return toOrchestrationPlanListView(this.product.listPlans(workspaceId));
  }

  @Get('plans/:planId')
  getPlan(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: OrchestrationPlanIdParamDto,
  ): OrchestrationPlanView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const plan = this.product.getPlan(workspaceId, params.planId);
    if (!plan) throw new NotFoundException('Orchestration plan not found');
    return plan;
  }

  @Post('runs')
  @Roles(Role.Trader, Role.Admin)
  requestRun(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: RequestOrchestrationRunBodyDto,
  ): OrchestrationCommandView {
    const context = this.authorizeCommand(request.user, workspaceHeader);
    try {
      return this.product.requestRun({
        workspaceId: context.workspaceId,
        requestedBy: context.actorId,
        marketSymbol: body.marketSymbol,
        exchangeScopeId: body.exchangeScopeId,
        modeContext: body.modeContext,
        objective: body.objective,
        orchestrationPlanId: body.orchestrationPlanId,
        marketStateId: body.marketStateId,
        requiresConfirmation: body.requiresConfirmation,
      });
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Get('runs')
  listRuns(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListOrchestrationHistoryQueryDto,
  ): OrchestrationHistoryView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return toOrchestrationHistoryView(this.product.listRuns(workspaceId, query.limit ?? 50));
  }

  @Get('runs/:runId')
  getRun(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: OrchestrationRunIdParamDto,
  ): OrchestrationRunDetailView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const run = this.product.getRun(workspaceId, params.runId);
    if (!run) throw new NotFoundException('Orchestration run not found');
    return run;
  }

  @Post('runs/:runId/confirm')
  @Roles(Role.Trader, Role.Admin)
  confirmRun(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: OrchestrationRunIdParamDto,
  ): OrchestrationCommandView {
    const context = this.authorizeCommand(request.user, workspaceHeader);
    try {
      return this.product.confirmRun({
        workspaceId: context.workspaceId,
        orchestrationRunId: params.runId,
        confirmedBy: context.actorId,
      });
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Post('runs/:runId/cancel')
  @Roles(Role.Trader, Role.Admin)
  cancelRun(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: OrchestrationRunIdParamDto,
    @Body() body: CancelOrchestrationRunBodyDto,
  ): OrchestrationCommandView {
    const context = this.authorizeCommand(request.user, workspaceHeader);
    try {
      return this.product.cancelRun({
        workspaceId: context.workspaceId,
        orchestrationRunId: params.runId,
        cancelledBy: context.actorId,
        reason: body.reason,
      });
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Post('runs/:runId/selections')
  @Roles(Role.Trader, Role.Admin)
  proposeSelection(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: OrchestrationRunIdParamDto,
    @Body() body: ProposeSelectionBodyDto,
  ): OrchestrationCommandView {
    const context = this.authorizeCommand(request.user, workspaceHeader);
    try {
      return this.product.proposeSelection({
        workspaceId: context.workspaceId,
        orchestrationRunId: params.runId,
        libraryEntryId: body.libraryEntryId,
        strategyVersionId: body.strategyVersionId,
        envelopeVersion: body.envelopeVersion,
        tacticPoint: body.tacticPoint,
        proposedBy: context.actorId,
      });
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Post('runs/:runId/handoff')
  @Roles(Role.Trader, Role.Admin)
  emitHandoff(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: OrchestrationRunIdParamDto,
    @Body() body: EmitSessionHandoffBodyDto,
  ): OrchestrationCommandView {
    const context = this.authorizeCommand(request.user, workspaceHeader);
    try {
      return this.product.emitHandoff({
        workspaceId: context.workspaceId,
        orchestrationRunId: params.runId,
        selectionDecisionId: body.selectionDecisionId,
        deploymentBindRef: body.deploymentBindRef,
        requestedBy: context.actorId,
      });
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Get('selections/:selectionDecisionId')
  getSelection(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: SelectionDecisionIdParamDto,
  ): SelectionDecisionView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const selection = this.product.getSelection(workspaceId, params.selectionDecisionId);
    if (!selection) throw new NotFoundException('Selection decision not found');
    return selection;
  }

  @Get('handoffs/:sessionHandoffIntentId')
  getHandoff(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: SessionHandoffIntentIdParamDto,
  ): SessionHandoffIntentView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const handoff = this.product.getHandoff(workspaceId, params.sessionHandoffIntentId);
    if (!handoff) throw new NotFoundException('Session handoff intent not found');
    return handoff;
  }

  private authorizeCommand(user: AuthUser, workspaceHeader: string | undefined) {
    try {
      return this.commandAuthorization.authorizeTradingCommand({
        user,
        workspaceId: requiredHeader(workspaceHeader, 'X-Workspace-Id'),
      });
    } catch {
      throw new ForbiddenException('workspace or trading role denied');
    }
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

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new BadRequestException(`${name} header is required`);
  return normalized;
}

function mapCommandError(error: unknown): Error {
  if (isOrchestrationRejectedError(error)) {
    if (error.outcome === 'failed' || error.reasons.includes('orchestration_run_not_found')) {
      return new NotFoundException({
        message: error.message,
        outcome: error.outcome,
        reasons: error.reasons,
        createsSession: false,
      });
    }
    return new UnprocessableEntityException({
      message: error.message,
      outcome: error.outcome,
      reasons: error.reasons,
      orchestrationRunId: error.result.orchestrationRunId,
      selectionDecisionId: error.result.selectionDecisionId ?? null,
      sessionHandoffIntentId: error.result.sessionHandoffIntentId ?? null,
      enforcementDecisionRef: error.result.enforcementDecisionRef ?? null,
      authorityClass: 'orchestration_artifact',
      createsSession: false,
      forcesTrade: false,
      submitsOrders: false,
      approvesRisk: false,
    });
  }
  const text = error instanceof Error ? error.message : 'orchestration command failed';
  return new BadRequestException(text);
}
