import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
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

/**
 * Paper Trading Foundation HTTP surface (W2-S04-a).
 *
 * Paper Account only. No orders, positions, portfolio, PnL, or trading controls.
 */
@Controller({ path: 'paper-trading-foundation', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class PaperTradingFoundationController {
  constructor(
    private readonly accounts: PaperTradingAccountService,
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
      throw mapCreateError(error);
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
      throw mapLifecycleError(error);
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
      throw mapLifecycleError(error);
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

function mapCreateError(error: unknown): Error {
  if (error instanceof PaperTradingAccountDuplicateError) {
    return new ConflictException('Paper Account already exists for this workspace');
  }
  const text = error instanceof Error ? error.message : 'paper account create failed';
  if (text.includes('currency') || text.includes('balance') || text.includes('required')) {
    return new BadRequestException(text);
  }
  return new BadRequestException('Paper Account could not be created.');
}

function mapLifecycleError(error: unknown): Error {
  if (error instanceof PaperTradingAccountNotFoundError) {
    return new NotFoundException('Paper Account not found');
  }
  const text = error instanceof Error ? error.message : 'paper account update failed';
  if (text.includes('cannot disable') || text.includes('cannot activate')) {
    return new BadRequestException(text);
  }
  return new BadRequestException('Paper Account could not be updated.');
}
