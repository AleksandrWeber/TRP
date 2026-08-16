import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../identity/role';
import { decideAuthorization } from './authorization-decision';
import { PermissionClass } from './permission-catalog';
import type { AuthUser } from './jwt.strategy';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';

export type TradingCommandContext = Readonly<{
  actorId: string;
  workspaceId: string;
  role: Role;
  correlationId: string | null;
  idempotencyKey: string | null;
}>;

/**
 * M2 trading command authorization (US158 / V3-S02-a).
 * Paper commands require an explicit C5 allow (Trader or Admin — listed cells,
 * not inheritance) and verified workspace membership. Ownership always wins.
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
    if (!this.canIssueTradingCommand(input.user.role)) {
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
    return decideAuthorization({
      role,
      action: PermissionClass.PaperCommand,
    }).allowed;
  }
}

function optionalId(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
