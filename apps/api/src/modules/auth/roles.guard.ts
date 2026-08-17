import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { NoOpLogger } from '../../logging/noop.logger';
import { isKnownRole, type Role } from '../identity/role';
import { decideAuthorization } from './authorization-decision';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { recordC6Deny } from './authorization-events';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { PERMISSION_KEY } from './decorators/require-permission.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';
import type { AuthUser } from './jwt.strategy';
import { PermissionClass } from './permission-catalog';

/**
 * Enforces `@Roles(...)` and `@RequirePermission(...)` (US107 / V3-S02-a/b/e).
 * Permission classes use the Version 3 matrix (default deny, explicit allow).
 * `@Public()` is the only unclassified allow. Missing permission metadata is
 * denied. Unknown roles are denied. C6 denials emit a structured authz event.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(SecurityAuditService) private readonly audit?: SecurityAuditService,
  ) {
    this.logger = logger?.child('RolesGuard') ?? new NoOpLogger();
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermission = this.reflector.getAllAndOverride<unknown>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    const hasPermissionMetadata = requiredPermission !== undefined && requiredPermission !== null;
    const hasRoleMetadata = Boolean(requiredRoles && requiredRoles.length > 0);

    if (hasPermissionMetadata) {
      if (!user) {
        return false;
      }
      const decision = decideAuthorization({ role: user.role, action: requiredPermission });
      if (!decision.allowed) {
        if (requiredPermission === PermissionClass.RoleAdmin) {
          recordC6Deny(
            this.logger,
            {
              actorUserId: user.userId,
              role: String(user.role),
              reason: decision.reason,
            },
            this.audit,
          );
        }
        return false;
      }
    }

    if (hasRoleMetadata) {
      if (!user) {
        return false;
      }
      if (!isKnownRole(user.role) || !requiredRoles!.includes(user.role)) {
        return false;
      }
    }

    if (user && !isKnownRole(user.role)) {
      return false;
    }

    if (!hasPermissionMetadata && !hasRoleMetadata) {
      return false;
    }

    return true;
  }
}
