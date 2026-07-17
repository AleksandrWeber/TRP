import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../identity/role';

export const ROLES_KEY = 'roles';

/**
 * Restrict route to callers whose Identity role is one of the listed roles (US107).
 * Example: `@Roles(Role.Admin)`
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
