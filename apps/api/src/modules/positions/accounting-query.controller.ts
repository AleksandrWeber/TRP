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
import type { AuthUser } from '../auth/jwt.strategy';
import {
  LEDGER_HISTORY_DEFAULT_LIMIT,
  LEDGER_HISTORY_MAX_LIMIT,
  LedgerHistoryCursorError,
} from '../ledger/domain/ledger-history-cursor';
import { WorkspaceAccessService } from '../workspace';
import { AccountingQueryService, type LedgerHistoryRead } from './accounting-query.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

type RequestWithUser = { user: AuthUser };

type LedgerHistoryQuery = Readonly<{
  limit?: string | string[];
  cursor?: string | string[];
}>;

/** Workspace/account-scoped, read-only accounting API (US178). */
@Controller({ path: 'accounting', version: '1' })
@RequirePermission(PermissionClass.Projection)
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
    @Query() query?: LedgerHistoryQuery,
  ) {
    return this.run(request.user, workspaceHeader, async (workspaceId) => {
      const page = parseLedgerHistoryQuery(query);
      try {
        return await this.queries.ledgerView(workspaceId, paperAccountId, page);
      } catch (error) {
        if (error instanceof LedgerHistoryCursorError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    });
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

const LIMIT_ERROR = 'Ledger history limit must be an integer between 1 and 100.';

function parseLedgerHistoryQuery(query: LedgerHistoryQuery | undefined): LedgerHistoryRead {
  const limitRaw = singleQueryValue(query?.limit, 'limit');
  const cursorText = singleQueryValue(query?.cursor, 'cursor')?.trim();
  const limit =
    limitRaw === undefined ? LEDGER_HISTORY_DEFAULT_LIMIT : parseExplicitLimit(limitRaw.trim());
  return cursorText ? { limit, cursor: cursorText } : { limit };
}

function parseExplicitLimit(limitText: string): number {
  if (!/^\d+$/.test(limitText)) throw new BadRequestException(LIMIT_ERROR);
  const limit = Number(limitText);
  if (!Number.isInteger(limit) || limit < 1 || limit > LEDGER_HISTORY_MAX_LIMIT) {
    throw new BadRequestException(LIMIT_ERROR);
  }
  return limit;
}

function singleQueryValue(value: string | string[] | undefined, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    throw new BadRequestException(`Ledger history ${name} must be a single value.`);
  }
  return value;
}
