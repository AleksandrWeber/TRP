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
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import {
  PaperOrderNotFoundError,
  PaperOrderService,
  PaperOrderValidationError,
} from './paper-order.service';
import type { PaperOrderListView, PaperOrderView } from './paper-order.projection';
import {
  PaperExecutionNotFoundError,
  PaperExecutionRejectedError,
  PaperExecutionService,
} from './paper-execution.service';
import type { PaperExecutionView, PaperFillListView, PaperFillView } from './paper-fill.projection';
import { PaperPortfolioNotFoundError, PaperPortfolioService } from './paper-portfolio.service';
import type {
  PaperExecutionHistoryView,
  PaperPnLView,
  PaperPortfolioView,
  PaperPositionListView,
} from './paper-portfolio.projection';
import {
  toPaperTradingAccountProjection,
  type PaperTradingAccountProjection,
} from './paper-trading-account.projection';
import {
  PaperTradingAccountNotFoundError,
  PaperTradingAccountService,
} from './paper-trading-account.service';
import { PaperTradingAccountDuplicateError } from './paper-trading-account.store';

type RequestWithUser = { user: AuthUser };

export type CreatePaperTradingAccountBody = Readonly<{
  baseCurrency?: string;
  startingBalance?: string;
}>;

export type CreatePaperOrderBody = Readonly<{
  paperAccountId?: string;
  exchange?: string;
  symbol?: string;
  side?: string;
  orderType?: string;
  quantity?: string;
  limitPrice?: string | null;
  stopPrice?: string | null;
  asDraft?: boolean;
}>;

export type UpdatePaperOrderBody = Readonly<{
  exchange?: string;
  symbol?: string;
  side?: string;
  orderType?: string;
  quantity?: string;
  limitPrice?: string | null;
  stopPrice?: string | null;
}>;

/**
 * Paper Trading Foundation HTTP surface (W2-S04-a/b/c/d).
 *
 * Paper Account + Orders + Execution/Fills + Positions/Portfolio/PnL/History.
 * No Ledger, Live Trading, or exchange inventory.
 */
@Controller({ path: 'paper-trading-foundation', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class PaperTradingFoundationController {
  constructor(
    private readonly accounts: PaperTradingAccountService,
    private readonly orders: PaperOrderService,
    private readonly execution: PaperExecutionService,
    private readonly portfolio: PaperPortfolioService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('account')
  async getAccount(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperTradingAccountProjection> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.accounts.getProjection(workspaceId);
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('account')
  async createAccount(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: CreatePaperTradingAccountBody,
  ): Promise<PaperTradingAccountProjection> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      const account = await this.accounts.create({
        workspaceId,
        ownerId: request.user.userId,
        baseCurrency: body?.baseCurrency,
        startingBalance: body?.startingBalance,
      });
      return toPaperTradingAccountProjection(account);
    } catch (error) {
      throw mapAccountCreateError(error);
    }
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('account/disable')
  async disableAccount(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperTradingAccountProjection> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      const account = await this.accounts.disable(workspaceId, request.user.userId);
      return toPaperTradingAccountProjection(account);
    } catch (error) {
      throw mapAccountLifecycleError(error);
    }
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('account/activate')
  async activateAccount(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperTradingAccountProjection> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      const account = await this.accounts.activate(workspaceId, request.user.userId);
      return toPaperTradingAccountProjection(account);
    } catch (error) {
      throw mapAccountLifecycleError(error);
    }
  }

  @Get('orders')
  async listOrders(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperOrderListView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.orders.list(workspaceId);
  }

  @Get('orders/:orderId')
  async getOrder(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('orderId') orderId: string,
  ): Promise<PaperOrderView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.orders.get(workspaceId, orderId);
    } catch (error) {
      throw mapOrderError(error);
    }
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('orders')
  async createOrder(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: CreatePaperOrderBody,
  ): Promise<PaperOrderView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.orders.create({
        workspaceId,
        actorUserId: request.user.userId,
        paperAccountId: body?.paperAccountId,
        exchange: body?.exchange ?? '',
        symbol: body?.symbol ?? '',
        side: body?.side ?? '',
        orderType: body?.orderType ?? '',
        quantity: body?.quantity ?? '',
        limitPrice: body?.limitPrice,
        stopPrice: body?.stopPrice,
        asDraft: body?.asDraft,
      });
    } catch (error) {
      throw mapOrderError(error);
    }
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Patch('orders/:orderId')
  async updateOrder(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('orderId') orderId: string,
    @Body() body: UpdatePaperOrderBody,
  ): Promise<PaperOrderView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.orders.update({
        workspaceId,
        actorUserId: request.user.userId,
        orderId,
        exchange: body?.exchange,
        symbol: body?.symbol,
        side: body?.side,
        orderType: body?.orderType,
        quantity: body?.quantity,
        limitPrice: body?.limitPrice,
        stopPrice: body?.stopPrice,
      });
    } catch (error) {
      throw mapOrderError(error);
    }
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('orders/:orderId/cancel')
  async cancelOrder(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('orderId') orderId: string,
  ): Promise<PaperOrderView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.orders.cancel(workspaceId, orderId, request.user.userId);
    } catch (error) {
      throw mapOrderError(error);
    }
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('orders/:orderId/execute')
  async executeOrder(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('orderId') orderId: string,
  ): Promise<PaperExecutionView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.execution.execute({
        workspaceId,
        actorUserId: request.user.userId,
        orderId,
      });
    } catch (error) {
      throw mapExecutionError(error);
    }
  }

  @Get('fills')
  async listFills(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperFillListView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.execution.listFills(workspaceId);
  }

  @Get('fills/:fillId')
  async getFill(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('fillId') fillId: string,
  ): Promise<PaperFillView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.execution.getFill(workspaceId, fillId);
    } catch (error) {
      throw mapExecutionError(error);
    }
  }

  @Get('positions')
  async listPositions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperPositionListView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.portfolio.getPositions(workspaceId);
    } catch (error) {
      throw mapPortfolioError(error);
    }
  }

  @Get('portfolio')
  async getPortfolio(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperPortfolioView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.portfolio.getPortfolio(workspaceId);
    } catch (error) {
      throw mapPortfolioError(error);
    }
  }

  @Get('pnl')
  async getPnL(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperPnLView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.portfolio.getPnL(workspaceId);
    } catch (error) {
      throw mapPortfolioError(error);
    }
  }

  @Get('execution-history')
  async getExecutionHistory(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PaperExecutionHistoryView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.portfolio.getExecutionHistory(workspaceId);
    } catch (error) {
      throw mapPortfolioError(error);
    }
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

function mapAccountCreateError(error: unknown): Error {
  if (error instanceof PaperTradingAccountDuplicateError) {
    return new ConflictException('Paper Account already exists for this workspace');
  }
  const text = error instanceof Error ? error.message : 'paper account create failed';
  if (text.includes('currency') || text.includes('balance') || text.includes('required')) {
    return new BadRequestException(text);
  }
  return new BadRequestException('Paper Account could not be created.');
}

function mapAccountLifecycleError(error: unknown): Error {
  if (error instanceof PaperTradingAccountNotFoundError) {
    return new NotFoundException('Paper Account not found');
  }
  const text = error instanceof Error ? error.message : 'paper account update failed';
  if (text.includes('cannot disable') || text.includes('cannot activate')) {
    return new BadRequestException(text);
  }
  return new BadRequestException('Paper Account could not be updated.');
}

function mapOrderError(error: unknown): Error {
  if (error instanceof PaperOrderNotFoundError) {
    return new NotFoundException('Paper Order not found');
  }
  if (error instanceof PaperOrderValidationError) {
    return new BadRequestException(error.message);
  }
  const text = error instanceof Error ? error.message : 'paper order failed';
  return new BadRequestException(text);
}

function mapExecutionError(error: unknown): Error {
  if (error instanceof PaperExecutionNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof PaperExecutionRejectedError) {
    return new BadRequestException(error.message);
  }
  const text = error instanceof Error ? error.message : 'paper execution failed';
  return new BadRequestException(text);
}

function mapPortfolioError(error: unknown): Error {
  if (error instanceof PaperPortfolioNotFoundError) {
    return new NotFoundException(error.message);
  }
  const text = error instanceof Error ? error.message : 'paper portfolio failed';
  return new BadRequestException(text);
}
