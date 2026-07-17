import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../identity/role';
import { ROLES_KEY } from './decorators/roles.decorator';
import type { AuthUser } from './jwt.strategy';

/**
 * Enforces `@Roles(...)` metadata against the authenticated Identity role (US107).
 * Endpoints without `@Roles` remain open to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
