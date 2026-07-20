import {
  Body,
  Controller,
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
  LiveConnectionFailedError,
  LiveExecutionFailedError,
  LiveOrderRejectedError,
  LiveRecoveryFailedError,
  LiveSessionAlreadyActiveError,
  LiveSessionInvalidStateError,
  LiveSessionNotFoundError,
  LiveSessionValidationError,
  LiveSynchronizationFailedError,
  LiveTradingError,
} from './live-trading-errors';
import { LiveTradingService } from './live-trading.service';

type RequestWithUser = { user: AuthUser };

/**
 * Live Trading Workspace REST API (US210).
 * Path `live` → `/v1/live/...`.
 */
@Controller({ path: 'live', version: '1' })
export class LiveTradingController {
  constructor(
    private readonly live: LiveTradingService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get('sessions')
  async listSessions(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.listSessions(workspaceId);
    });
  }

  @Get('status')
  async getStatus(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.getStatus(workspaceId);
    });
  }

  @Get('health')
  async getHealth(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.getHealth(workspaceId);
    });
  }

  @Get('synchronization')
  async getSynchronization(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.getSynchronization(workspaceId);
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
      return this.live.listOrders(workspaceId, req.user.userId, id);
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
      return this.live.listPositions(workspaceId, req.user.userId, id);
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
      return this.live.getPortfolio(workspaceId, req.user.userId, id);
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
      return this.live.listEvents(workspaceId, id);
    });
  }

  @Post('start')
  async start(
    @Req() req: RequestWithUser,
    @Body() body: { exchange?: string; accountId?: string; sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.start(workspaceId, req.user.userId, {
        exchange: String(body.exchange ?? ''),
        accountId: String(body.accountId ?? ''),
        sessionId: body.sessionId !== undefined ? String(body.sessionId) : undefined,
      });
    });
  }

  @Post('stop')
  async stop(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.stop(workspaceId, String(body.sessionId ?? ''));
    });
  }

  @Post('pause')
  async pause(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.pause(workspaceId, String(body.sessionId ?? ''));
    });
  }

  @Post('resume')
  async resume(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.resume(workspaceId, String(body.sessionId ?? ''));
    });
  }

  @Post('reconnect')
  async reconnect(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.reconnect(workspaceId, req.user.userId, String(body.sessionId ?? ''));
    });
  }

  @Post('synchronize')
  async synchronize(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.synchronize(workspaceId, req.user.userId, String(body.sessionId ?? ''));
    });
  }

  @Post('kill-switch')
  async killSwitch(
    @Req() req: RequestWithUser,
    @Body()
    body: { sessionId?: string; closePositions?: boolean; reason?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.activateKillSwitch(
        workspaceId,
        req.user.userId,
        String(body.sessionId ?? ''),
        {
          closePositions: body.closePositions,
          reason: body.reason !== undefined ? String(body.reason) : undefined,
        },
      );
    });
  }

  @Post('kill-switch/clear')
  async clearKillSwitch(
    @Req() req: RequestWithUser,
    @Body() body: { sessionId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.clearKillSwitch(workspaceId, String(body.sessionId ?? ''));
    });
  }

  @Post('orders')
  async submitOrder(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      sessionId?: string;
      symbol?: string;
      side?: string;
      type?: string;
      quantity?: string;
      requestedPrice?: string | null;
      timeInForce?: string;
    },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.live.submitOrder(workspaceId, req.user.userId, String(body.sessionId ?? ''), {
        symbol: String(body.symbol ?? ''),
        side: String(body.side ?? ''),
        type: String(body.type ?? ''),
        quantity: String(body.quantity ?? ''),
        requestedPrice:
          body.requestedPrice === undefined || body.requestedPrice === null
            ? body.requestedPrice
            : String(body.requestedPrice),
        timeInForce: body.timeInForce !== undefined ? String(body.timeInForce) : undefined,
      });
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
    if (error instanceof LiveSessionNotFoundError) {
      return new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: error.message,
        code: error.code,
      });
    }
    if (error instanceof LiveTradingError) {
      const status =
        error instanceof LiveSessionValidationError ||
        error instanceof LiveSessionInvalidStateError ||
        error instanceof LiveSessionAlreadyActiveError ||
        error instanceof LiveOrderRejectedError ||
        error instanceof LiveExecutionFailedError ||
        error instanceof LiveSynchronizationFailedError ||
        error instanceof LiveRecoveryFailedError ||
        error instanceof LiveConnectionFailedError
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
