import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  CreateStrategyDeploymentBodyDto,
  StrategyDeploymentIdParamDto,
} from '../../validation/dto/strategy-deployment.dto';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { WorkspaceAccessService } from '../workspace';
import type { StrategyDeployment } from './domain/strategy-deployment';
import { StrategyDeploymentService } from './strategy-deployment.service';

type RequestWithUser = { user: AuthUser };

/**
 * Strategy Deployment command/query API (US211).
 * Create draft, approve (freeze), get, and list. No Runtime, Session, Orders,
 * Risk evaluation, or Execution endpoints.
 */
@Controller({ path: 'strategy-deployments', version: '1' })
export class StrategyDeploymentController {
  constructor(
    private readonly deployments: StrategyDeploymentService,
    private readonly commandAuthorization: CommandAuthorizationService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Post()
  @Roles(Role.Trader, Role.Admin)
  async create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('idempotency-key') idempotencyHeader: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
    @Body() body: CreateStrategyDeploymentBodyDto,
  ) {
    const context = this.authorizeCommand(
      request.user,
      requiredHeader(workspaceHeader, 'X-Workspace-Id'),
      requiredHeader(idempotencyHeader, 'Idempotency-Key'),
      correlationId,
    );
    const now = new Date().toISOString();
    try {
      return toView(
        await this.deployments.create({
          workspaceId: context.workspaceId,
          strategyId: body.strategyId,
          strategyVersion: body.strategyVersion,
          experimentId: body.experimentId,
          parameters: body.parameters,
          instrument: body.instrument,
          timeframe: body.timeframe,
          marketDataSourceId: body.marketDataSourceId,
          paperExecutionConfigurationId: body.paperExecutionConfigurationId,
          riskPolicyId: body.riskPolicyId,
          riskPolicyVersion: body.riskPolicyVersion,
          metadata: body.metadata,
          idempotencyKey: context.idempotencyKey!,
          actorId: context.actorId,
          correlationId: context.correlationId ?? undefined,
          createdAt: now,
          recordedAt: now,
        }),
      );
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Post(':id/approve')
  @Roles(Role.Trader, Role.Admin)
  async approve(
    @Req() request: RequestWithUser,
    @Param() params: StrategyDeploymentIdParamDto,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
  ) {
    const context = this.authorizeCommand(
      request.user,
      requiredHeader(workspaceHeader, 'X-Workspace-Id'),
      undefined,
      correlationId,
    );
    const now = new Date().toISOString();
    try {
      return toView(
        await this.deployments.approve({
          workspaceId: context.workspaceId,
          deploymentId: params.id,
          actorId: context.actorId,
          correlationId: context.correlationId ?? undefined,
          approvedAt: now,
          recordedAt: now,
        }),
      );
    } catch (error) {
      throw mapCommandError(error);
    }
  }

  @Get()
  async list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    const deployments = await this.deployments.list(workspaceId);
    return deployments.map(toView);
  }

  @Get(':id')
  async get(
    @Req() request: RequestWithUser,
    @Param() params: StrategyDeploymentIdParamDto,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    const deployment = await this.deployments.get(workspaceId, params.id);
    if (!deployment) throw new NotFoundException();
    return toView(deployment);
  }

  private authorizeCommand(
    user: AuthUser,
    workspaceId: string,
    idempotencyKey: string | undefined,
    correlationId: string | undefined,
  ) {
    try {
      return this.commandAuthorization.authorizeTradingCommand({
        user,
        workspaceId,
        idempotencyKey,
        correlationId,
      });
    } catch {
      throw new ForbiddenException('workspace or trading role denied');
    }
  }

  private authorizeQuery(user: AuthUser, workspaceId: string): void {
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
  }
}

export type StrategyDeploymentView = {
  id: string;
  workspaceId: string;
  strategyId: string;
  strategyVersion: string;
  experimentId: string | null;
  parameters: Readonly<Record<string, unknown>>;
  instrument: string;
  timeframe: string;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  configurationHash: string;
  status: string;
  version: number;
  approvedAt: string | null;
  approvedByActorId: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  metadata: Readonly<Record<string, unknown>>;
};

function toView(deployment: StrategyDeployment): StrategyDeploymentView {
  return {
    id: deployment.id,
    workspaceId: deployment.workspaceId,
    strategyId: deployment.strategyId,
    strategyVersion: deployment.strategyVersion,
    experimentId: deployment.experimentId,
    parameters: deployment.parameters,
    instrument: deployment.instrument,
    timeframe: deployment.timeframe,
    marketDataSourceId: deployment.marketDataSourceId,
    paperExecutionConfigurationId: deployment.paperExecutionConfigurationId,
    riskPolicyId: deployment.riskPolicyId,
    riskPolicyVersion: deployment.riskPolicyVersion,
    configurationHash: deployment.configurationHash,
    status: deployment.status,
    version: deployment.version,
    approvedAt: deployment.approvedAt,
    approvedByActorId: deployment.approvedByActorId,
    createdAt: deployment.createdAt,
    recordedAt: deployment.recordedAt,
    actorId: deployment.actorId,
    correlationId: deployment.correlationId,
    metadata: deployment.metadata,
  };
}

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new BadRequestException(`${name} header is required`);
  return normalized;
}

function mapCommandError(error: unknown): Error {
  const text = error instanceof Error ? error.message : 'strategy deployment command failed';
  if (text === 'strategy deployment not found in workspace') return new NotFoundException();
  if (text === 'strategy not found in workspace') return new NotFoundException(text);
  if (text.includes('idempotency key reused')) return new ConflictException(text);
  if (text.includes('already approved') || text.includes('immutable')) {
    return new ConflictException(text);
  }
  return new BadRequestException(text);
}
