/**
 * Role → permission mapping (V3-S02-a).
 *
 * Explicit allow only. No inheritance engine.
 * Admin paper-command ability is a listed cell, not `Admin extends Trader`.
 * C0 is public transport (`@Public()`), not a role grant.
 * C7 / C8 / C9 are never granted in this package.
 */

import { Role } from '../identity/role';
import { PermissionClass } from './permission-catalog';

const READER_ALLOWS = [
  PermissionClass.Self,
  PermissionClass.OwnWorkspace,
  PermissionClass.Projection,
] as const;

const RESEARCHER_ALLOWS = [
  PermissionClass.Self,
  PermissionClass.OwnWorkspace,
  PermissionClass.Projection,
  PermissionClass.Research,
] as const;

const TRADER_ALLOWS = [
  PermissionClass.Self,
  PermissionClass.OwnWorkspace,
  PermissionClass.Projection,
  PermissionClass.Research,
  PermissionClass.PaperCommand,
] as const;

const ADMIN_ALLOWS = [
  PermissionClass.Self,
  PermissionClass.OwnWorkspace,
  PermissionClass.Projection,
  PermissionClass.Research,
  PermissionClass.PaperCommand,
  PermissionClass.RoleAdmin,
] as const;

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly PermissionClass[]>> = {
  [Role.Reader]: READER_ALLOWS,
  [Role.Researcher]: RESEARCHER_ALLOWS,
  [Role.Trader]: TRADER_ALLOWS,
  [Role.Admin]: ADMIN_ALLOWS,
};

const ROLE_PERMISSION_SETS: Readonly<Record<Role, ReadonlySet<PermissionClass>>> = {
  [Role.Reader]: new Set(READER_ALLOWS),
  [Role.Researcher]: new Set(RESEARCHER_ALLOWS),
  [Role.Trader]: new Set(TRADER_ALLOWS),
  [Role.Admin]: new Set(ADMIN_ALLOWS),
};

export function permissionsForRole(role: Role): ReadonlySet<PermissionClass> {
  return ROLE_PERMISSION_SETS[role];
}

export function roleAllowsPermission(role: Role, permission: PermissionClass): boolean {
  return ROLE_PERMISSION_SETS[role].has(permission);
}
