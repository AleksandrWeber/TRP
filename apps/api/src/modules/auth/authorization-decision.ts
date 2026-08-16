/**
 * Authorization decision (V3-S02-a).
 *
 * Default deny. Explicit allow. Permissions are additive per role.
 * Ownership always wins. Unknown role / permission / action → denied.
 * Does not create resources, own identity, or own sessions.
 */

import { isKnownRole } from '../identity/role';
import { permissionRequiresMembership, resolvePermission } from './permission-catalog';
import { roleAllowsPermission } from './permission-matrix';

export type AuthorizationDenyReason =
  'unknown_role' | 'unknown_permission' | 'unknown_action' | 'missing_permission' | 'not_member';

export type AuthorizationDecision =
  { allowed: true } | { allowed: false; reason: AuthorizationDenyReason };

export type AuthorizationRequest = {
  role: unknown;
  action: unknown;
  /** When false, workspace-scoped classes are denied. Undefined skips membership. */
  workspaceMember?: boolean;
};

export function decideAuthorization(request: AuthorizationRequest): AuthorizationDecision {
  if (!isKnownRole(request.role)) {
    return deny('unknown_role');
  }

  if (request.action === undefined || request.action === null || request.action === '') {
    return deny('unknown_action');
  }

  const permission = resolvePermission(request.action);
  if (permission === null) {
    return deny('unknown_permission');
  }

  if (request.workspaceMember === false && permissionRequiresMembership(permission)) {
    return deny('not_member');
  }

  if (!roleAllowsPermission(request.role, permission)) {
    return deny('missing_permission');
  }

  return { allowed: true };
}

function deny(reason: AuthorizationDenyReason): AuthorizationDecision {
  return { allowed: false, reason };
}
