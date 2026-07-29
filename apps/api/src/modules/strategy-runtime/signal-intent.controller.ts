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
  ListSignalIntentsQueryDto,
  SignalIntentIdParamDto,
} from '../../validation/dto/signal-intent.dto';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import type { SignalIntent } from './domain/signal-intent';
import { SignalIntentService } from './signal-intent.service';

type RequestWithUser = { user: AuthUser };

/**
 * Signal Intent query API (US214).
 * Read-only. Create/emit remains an internal Strategy Runtime service port —
 * no public create, Order, Risk, or Execution endpoints.
 */
@Controller({ path: 'signal-intents', version: '1' })
export class SignalIntentController {
  constructor(
    private readonly intents: SignalIntentService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  async listBySession(
    @Req() request: RequestWithUser,
    @Query() query: ListSignalIntentsQueryDto,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = this.assertMember(
      request.user,
      requiredHeader(workspaceHeader, 'X-Workspace-Id'),
    );
    const intents = await this.intents.listBySession(workspaceId, query.sessionId);
    return intents.map(toView);
  }

  @Get(':id')
  async getById(
    @Req() request: RequestWithUser,
    @Param() params: SignalIntentIdParamDto,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = this.assertMember(
      request.user,
      requiredHeader(workspaceHeader, 'X-Workspace-Id'),
    );
    const intent = await this.intents.get(workspaceId, params.id);
    if (!intent) throw new NotFoundException('signal intent not found in workspace');
    return toView(intent);
  }

  private assertMember(user: AuthUser, workspaceId: string): string {
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
      return workspaceId;
    } catch (error) {
      throw mapAccessError(error);
    }
  }
}

function toView(intent: SignalIntent) {
  return {
    id: intent.id,
    intentHash: intent.intentHash,
    intentVersion: intent.intentVersion,
    workspaceId: intent.workspaceId,
    deploymentId: intent.deploymentId,
    sessionId: intent.sessionId,
    strategyVersion: intent.strategyVersion,
    instrument: intent.instrument,
    timeframe: intent.timeframe,
    direction: intent.direction,
    confidence: intent.confidence,
    marketCheckpoint: intent.marketCheckpoint,
    generatedAt: intent.generatedAt,
    recordedAt: intent.recordedAt,
    actorId: intent.actorId,
    correlationId: intent.correlationId,
    metadata: intent.metadata,
  };
}

function requiredHeader(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new BadRequestException(`${name} header is required`);
  return trimmed;
}

function mapAccessError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'workspace access denied';
  if (/not a member|access denied|forbidden/i.test(message)) {
    throw new ForbiddenException(message);
  }
  throw new BadRequestException(message);
}
