import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceDomainService } from '../workspace';
import {
  PaperExecutionFailedError,
  PaperOrderRejectedError,
  PaperSessionInvalidStateError,
  PaperSessionNotFoundError,
  PaperSessionValidationError,
  PaperTradingError,
} from './paper-trading-errors';
import { PaperTradingService } from './paper-trading.service';

type RequestWithUser = { user: AuthUser };

/**
 * Paper Trading Engine REST API (US208).
 * Path `paper` → `/v1/paper/...`. Distinct from US010 `/v1/paper-trading`.
 */
@Controller({ path: 'paper', version: '1' })
export class PaperTradingController {
  constructor(
    private readonly paper: PaperTradingService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get('sessions')
  async listSessions(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.listSessions(workspaceId);
    });
  }

  @Get('sessions/:id')
  async getSession(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.getSession(workspaceId, id);
    });
  }

  @Get('sessions/:id/orders')
  async listOrders(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.listOrders(workspaceId, req.user.userId, id);
    });
  }

  @Get('sessions/:id/positions')
  async listPositions(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.listPositions(workspaceId, req.user.userId, id);
    });
  }

  @Get('sessions/:id/portfolio')
  async getPortfolio(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.getPortfolio(workspaceId, req.user.userId, id);
    });
  }

  @Get('sessions/:id/executions')
  async listExecutions(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.listExecutions(workspaceId, id);
    });
  }

  @Get('sessions/:id/events')
  async listEvents(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.listEvents(workspaceId, id);
    });
  }

  @Get('sessions/:id/statistics')
  async getStatistics(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.getStatistics(workspaceId, req.user.userId, id);
    });
  }

  @Post('sessions')
  async createSession(
    @Req() req: RequestWithUser,
    @Body() body: { name?: string; initialBalance?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.createSession(workspaceId, req.user.userId, {
        name: String(body.name ?? ''),
        initialBalance: body.initialBalance !== undefined ? String(body.initialBalance) : undefined,
      });
    });
  }

  @Post('sessions/:id/start')
  async startSession(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.startSession(workspaceId, id);
    });
  }

  @Post('sessions/:id/pause')
  async pauseSession(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.pauseSession(workspaceId, id);
    });
  }

  @Post('sessions/:id/stop')
  async stopSession(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.stopSession(workspaceId, id);
    });
  }

  @Post('sessions/:id/complete')
  async completeSession(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.completeSession(workspaceId, id);
    });
  }

  @Post('sessions/:id/orders')
  async executeTrade(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
      symbol?: string;
      side?: string;
      type?: string;
      quantity?: string;
      requestedPrice?: string | null;
      timeInForce?: string;
      marketPrice?: string;
    },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.executeTrade(workspaceId, req.user.userId, id, {
        symbol: String(body.symbol ?? ''),
        side: String(body.side ?? ''),
        type: String(body.type ?? ''),
        quantity: String(body.quantity ?? ''),
        requestedPrice:
          body.requestedPrice === undefined || body.requestedPrice === null
            ? body.requestedPrice
            : String(body.requestedPrice),
        timeInForce: body.timeInForce !== undefined ? String(body.timeInForce) : undefined,
        marketPrice: body.marketPrice !== undefined ? String(body.marketPrice) : undefined,
      });
    });
  }

  @Delete('sessions/:id')
  async deleteSession(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.paper.deleteSession(workspaceId, id);
    });
  }

  private workspace(header?: string): string {
    return requireWorkspaceId(header, this.workspaces);
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof PaperSessionNotFoundError) {
      return new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: error.message,
        code: error.code,
      });
    }
    if (error instanceof PaperTradingError) {
      const status =
        error instanceof PaperSessionValidationError ||
        error instanceof PaperSessionInvalidStateError ||
        error instanceof PaperOrderRejectedError ||
        error instanceof PaperExecutionFailedError
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return new HttpException(
        { statusCode: status, message: error.message, code: error.code },
        status,
      );
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
