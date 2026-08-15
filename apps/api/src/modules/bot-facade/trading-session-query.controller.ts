import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  NotFoundException,
  Optional,
  Param,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../strategy-runtime/ports/strategy-runtime.port';
import { WorkspaceAccessService } from '../workspace';
import { BotFacadeService } from './bot-facade.service';
import {
  toCommandCenterSessionView,
  type CommandCenterSessionView,
} from './command-center-session.view';
import type { BotView } from './domain/bot-view';
import { OperatorProjectionService, SessionHandoffConsumerService } from '../product-flow';

type RequestWithUser = { user: AuthUser };

/**
 * RC-20 Epic 2 / PC-13 — read-only Trading Session / Bot Facade projections.
 * PC-15 15-a: GET may include consumed SessionHandoffIntent without mutating Orchestrator.
 * PC-15 15-f: GET may include report/delivery projections without mutating owners.
 * Canonical path `trading-sessions`. No lifecycle mutations.
 */
@Controller({ path: 'trading-sessions', version: '1' })
export class TradingSessionQueryController {
  constructor(
    private readonly bots: BotFacadeService,
    private readonly workspaceAccess: WorkspaceAccessService,
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Optional() private readonly sessionHandoffConsumer?: SessionHandoffConsumerService,
    @Optional() private readonly operatorProjection?: OperatorProjectionService,
  ) {}

  @Get()
  async list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<readonly BotView[]> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    return this.bots.listBots(workspaceId);
  }

  @Get(':id')
  async get(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<CommandCenterSessionView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    const bot = await this.bots.getBot(workspaceId, id);
    if (!bot) throw new NotFoundException('Trading session not found');
    const [lifecycle, diagnostics, sessionHandoff, operatorProjection] = await Promise.all([
      this.runtime.getLifecycle(workspaceId, id).catch(() => null),
      this.runtime.getDiagnostics(workspaceId, id).catch(() => null),
      this.sessionHandoffConsumer?.projectConsume(workspaceId, id) ?? Promise.resolve(null),
      this.operatorProjection?.projectSession(workspaceId, id) ?? Promise.resolve(null),
    ]);
    return toCommandCenterSessionView(
      bot,
      lifecycle,
      diagnostics,
      sessionHandoff,
      operatorProjection,
    );
  }

  private authorizeQuery(user: AuthUser, workspaceId: string): void {
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
  }
}

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(`${name} header is required`);
  }
  return normalized;
}
