import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceDomainService } from '../workspace';
import {
  OrderError,
  OrderImmutableError,
  OrderInvalidStateError,
  OrderNotFoundError,
  OrderPortfolioSyncError,
  OrderPositionSyncError,
  OrderValidationError,
} from './order-errors';
import { OrderService } from './order.service';

type RequestWithUser = { user: AuthUser };

/**
 * Order Lifecycle Engine REST API (US206).
 * Path `trading-orders` avoids collision with paper OrdersController at `/v1/orders`.
 * No exchange or live execution.
 */
@Controller({ path: 'trading-orders', version: '1' })
export class OrderController {
  constructor(
    private readonly orders: OrderService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  async list(@Req() req: RequestWithUser, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.list(workspaceId, req.user.userId);
    });
  }

  @Get('open')
  async listOpen(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.listOpen(workspaceId, req.user.userId);
    });
  }

  @Get('history')
  async listHistory(
    @Req() req: RequestWithUser,
    @Query('orderId') orderId: string | undefined,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.listHistory(workspaceId, req.user.userId, orderId);
    });
  }

  @Get(':id')
  async getById(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.getById(workspaceId, req.user.userId, id);
    });
  }

  @Get(':id/fills')
  async listFills(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.listFills(workspaceId, req.user.userId, id);
    });
  }

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body()
    body: {
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
      return this.orders.create(workspaceId, req.user.userId, {
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

  @Post(':id/cancel')
  async cancel(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.cancel(
        workspaceId,
        req.user.userId,
        id,
        body.reason !== undefined ? String(body.reason) : undefined,
      );
    });
  }

  @Post(':id/execute')
  async execute(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { quantity?: string; price?: string; fee?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.execute(workspaceId, req.user.userId, id, {
        quantity: body.quantity !== undefined ? String(body.quantity) : undefined,
        price: String(body.price ?? ''),
        fee: body.fee !== undefined ? String(body.fee) : undefined,
      });
    });
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
      quantity?: string;
      requestedPrice?: string | null;
      timeInForce?: string;
    },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.orders.update(workspaceId, req.user.userId, id, {
        quantity: body.quantity !== undefined ? String(body.quantity) : undefined,
        requestedPrice:
          body.requestedPrice === undefined
            ? undefined
            : body.requestedPrice === null
              ? null
              : String(body.requestedPrice),
        timeInForce: body.timeInForce !== undefined ? String(body.timeInForce) : undefined,
      });
    });
  }

  private workspace(workspaceIdHeader?: string): string {
    return requireWorkspaceId(workspaceIdHeader, this.workspaces);
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      throw mapOrderError(error);
    }
  }
}

function mapOrderError(error: unknown): Error {
  if (error instanceof HttpException) return error;
  if (error instanceof OrderNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (
    error instanceof OrderValidationError ||
    error instanceof OrderInvalidStateError ||
    error instanceof OrderImmutableError ||
    error instanceof OrderPositionSyncError ||
    error instanceof OrderPortfolioSyncError
  ) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  if (error instanceof OrderError) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}
