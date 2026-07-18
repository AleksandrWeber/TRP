import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { AccountingQueryService } from './accounting-query.service';

type RequestWithUser = { user: AuthUser };

/** Workspace/account-scoped, read-only accounting API (US178). */
@Controller({ path: 'accounting', version: '1' })
export class AccountingQueryController {
  constructor(
    private readonly queries: AccountingQueryService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('accounts/:paperAccountId/fills')
  fills(
    @Req() request: RequestWithUser,
    @Param('paperAccountId') paperAccountId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    return this.run(request.user, workspaceHeader, (workspaceId) =>
      this.queries.fillView(workspaceId, paperAccountId),
    );
  }

  @Get('accounts/:paperAccountId/positions')
  positions(
    @Req() request: RequestWithUser,
    @Param('paperAccountId') paperAccountId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    return this.run(request.user, workspaceHeader, (workspaceId) =>
      this.queries.positionView(workspaceId, paperAccountId),
    );
  }

  @Get('accounts/:paperAccountId/ledger')
  ledger(
    @Req() request: RequestWithUser,
    @Param('paperAccountId') paperAccountId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    return this.run(request.user, workspaceHeader, (workspaceId) =>
      this.queries.ledgerView(workspaceId, paperAccountId),
    );
  }

  @Get('accounts/:paperAccountId/portfolio')
  portfolio(
    @Req() request: RequestWithUser,
    @Param('paperAccountId') paperAccountId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    return this.run(request.user, workspaceHeader, (workspaceId) =>
      this.queries.portfolioView(workspaceId, paperAccountId),
    );
  }

  @Get('accounts/:paperAccountId/reconciliation')
  reconciliation(
    @Req() request: RequestWithUser,
    @Param('paperAccountId') paperAccountId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    return this.run(request.user, workspaceHeader, (workspaceId) =>
      this.queries.reconciliationView(workspaceId, paperAccountId),
    );
  }

  private async run<T>(
    user: AuthUser,
    workspaceHeader: string | undefined,
    query: (workspaceId: string) => Promise<T>,
  ): Promise<T> {
    const workspaceId = requiredHeader(workspaceHeader);
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
    try {
      return await query(workspaceId);
    } catch (error) {
      if (error instanceof Error && error.message === 'paper account not found in workspace') {
        throw new NotFoundException();
      }
      throw error;
    }
  }
}

function requiredHeader(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new BadRequestException('X-Workspace-Id header is required');
  return normalized;
}
