import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../identity/role';
import type { AuthUser } from './jwt.strategy';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';

export type TradingCommandContext = Readonly<{
  actorId: string;
  workspaceId: string;
  role: Role;
  correlationId: string | null;
  idempotencyKey: string | null;
}>;

const TRADING_COMMAND_ROLES: ReadonlySet<Role> = new Set([Role.Trader, Role.Admin]);

/**
 * M2 trading command authorization (US158).
 * Manual create/cancel/session commands require Trader or Administrator (Admin)
 * and verified workspace membership. Actor / workspace / correlation /
 * idempotency identifiers are retained on the authorized context.
 */
@Injectable()
export class CommandAuthorizationService {
  constructor(
    @Inject(WorkspaceAccessService)
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  authorizeTradingCommand(input: {
    user: AuthUser;
    workspaceId: string;
    correlationId?: string;
    idempotencyKey?: string;
  }): TradingCommandContext {
    if (!TRADING_COMMAND_ROLES.has(input.user.role)) {
      throw new Error('trading command requires Trader or Administrator role');
    }

    const workspaceId = this.workspaceAccess.resolveAccessibleWorkspaceId(
      input.workspaceId,
      input.user.userId,
    );
    if (workspaceId === null) {
      throw new Error('workspace access denied');
    }

    return Object.freeze({
      actorId: input.user.userId,
      workspaceId,
      role: input.user.role,
      correlationId: optionalId(input.correlationId),
      idempotencyKey: optionalId(input.idempotencyKey),
    });
  }

  canIssueTradingCommand(role: Role): boolean {
    return TRADING_COMMAND_ROLES.has(role);
  }
}

function optionalId(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
