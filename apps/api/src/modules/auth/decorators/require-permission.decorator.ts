import { SetMetadata } from '@nestjs/common';
import type { PermissionClass } from '../permission-catalog';

export const PERMISSION_KEY = 'permissionClass';

/**
 * Restrict route to callers whose Identity role is explicitly allowed
 * the named permission class (V3-S02-a). Default is deny.
 */
export const RequirePermission = (permission: PermissionClass) =>
  SetMetadata(PERMISSION_KEY, permission);
