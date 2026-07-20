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
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { WorkspaceDomainService } from '../workspace';
import {
  ExchangeAdapterError,
  ExchangeNotFoundError,
  ExchangeValidationError,
  ExchangeAlreadyConnectedError,
  ExchangeConnectionFailedError,
  ExchangeNotConnectedError,
  ExchangeOrderRejectedError,
  ExchangeUnsupportedCapabilityError,
} from './exchange-adapter-errors';
import { ExchangeAdapterService } from './exchange-adapter.service';

type RequestWithUser = { user: AuthUser };

/**
 * Exchange Adapter Layer REST API (US209).
 * Path `exchanges` → `/v1/exchanges/...`.
 */
@Controller({ path: 'exchanges', version: '1' })
export class ExchangeAdapterController {
  constructor(
    private readonly exchanges: ExchangeAdapterService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  async list(@Req() _req: RequestWithUser, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.exchanges.listExchanges(workspaceId);
    });
  }

  @Get('status')
  async status(
    @Req() _req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.exchanges.getStatus(workspaceId);
    });
  }

  @Get(':id/capabilities')
  async capabilities(
    @Req() _req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.exchanges.getCapabilities(workspaceId, id);
    });
  }

  @Get(':id')
  async get(
    @Req() _req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.exchanges.getExchange(workspaceId, id);
    });
  }

  @Post('connect')
  @Roles(Role.Trader, Role.Admin)
  async connect(
    @Req() _req: RequestWithUser,
    @Body() body: { exchangeId?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.exchanges.connect(workspaceId, String(body.exchangeId ?? ''));
    });
  }

  @Post('disconnect')
  @Roles(Role.Trader, Role.Admin)
  async disconnect(
    @Req() _req: RequestWithUser,
    @Body() body: { exchangeId?: string; reason?: string | null },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.exchanges.disconnect(
        workspaceId,
        String(body.exchangeId ?? ''),
        body.reason ?? null,
      );
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
    if (error instanceof ExchangeNotFoundError) {
      return new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: error.message,
        code: error.code,
      });
    }
    if (error instanceof ExchangeAdapterError) {
      const status =
        error instanceof ExchangeValidationError ||
        error instanceof ExchangeAlreadyConnectedError ||
        error instanceof ExchangeNotConnectedError ||
        error instanceof ExchangeOrderRejectedError ||
        error instanceof ExchangeUnsupportedCapabilityError ||
        error instanceof ExchangeConnectionFailedError
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
