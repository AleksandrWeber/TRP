import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { NoOpLogger } from '../../logging/noop.logger';
import { AuthorizationDecisionService } from '../auth/authorization-decision.service';
import { PermissionClass } from '../auth/permission-catalog';
import { Role } from '../identity/role';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { VaultIsolationError } from './vault-errors';
import { recordVaultAccessDenied } from './vault-events';

export type VaultActor = Readonly<{
  userId: string;
  role: Role | undefined;
}>;

/**
 * S03-d Vault boundary: verified workspace ownership plus explicit C8 permission.
 * Caller-supplied workspace IDs and role claims are never sufficient on their own.
 */
@Injectable()
export class VaultAccessControl {
  private readonly logger: Logger;

  constructor(
    @Inject(WorkspaceAccessService)
    private readonly workspaceAccess: WorkspaceAccessService,
    @Inject(AuthorizationDecisionService)
    private readonly authorization: AuthorizationDecisionService,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(SecurityAuditService) private readonly audit?: SecurityAuditService,
  ) {
    this.logger = logger?.child(VaultAccessControl.name) ?? new NoOpLogger();
  }

  assertCanAccess(actor: VaultActor, workspaceId: string): void {
    const userId = actor.userId.trim();
    const targetWorkspaceId = workspaceId.trim();
    const member =
      userId !== '' &&
      targetWorkspaceId !== '' &&
      this.workspaceAccess.isMember(targetWorkspaceId, userId);
    const allowed = this.authorization.allows(actor.role, PermissionClass.VaultConnections, member);
    if (!allowed) {
      recordVaultAccessDenied(
        this.logger,
        { actorUserId: userId, workspaceId: targetWorkspaceId },
        this.audit,
      );
      // Keep foreign-workspace and role denial indistinguishable at the Vault boundary.
      throw new VaultIsolationError();
    }
  }
}
