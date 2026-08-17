import type { LogContext, Logger } from '../../logging/logger';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import type { SecurityAuditService } from '../security-audit/security-audit.service';
import { persistSecurityAuditEvent } from '../security-audit/security-audit-persist';
import { PermissionClass } from './permission-catalog';

/**
 * Structured authorization events (V3-S02-e).
 * Same Logger model as auth.login / auth.session. Not a new event store.
 * S05 may persist these later. No passwords, tokens, hashes, or emails.
 */

export const AUTHZ_ROLE_CHANGE_EVENT = 'authz.role-change';
export const AUTHZ_DENY_EVENT = 'authz.deny';

export type RoleChangeOutcome = 'assigned' | 'denied';

export type RoleChangeReason = 'self_role' | 'last_admin' | 'not_found';

export type RoleChangeEvent = {
  outcome: RoleChangeOutcome;
  actorUserId: string;
  subjectUserId: string;
  fromRole?: string;
  toRole?: string;
  reason?: RoleChangeReason;
  /** Identity role assignment is not workspace-scoped; omit when unknown. */
  workspaceId?: string;
};

export type C6DenyEvent = {
  actorUserId: string;
  role: string;
  reason: string;
  workspaceId?: string;
};

export async function recordRoleChange(
  logger: Logger,
  payload: RoleChangeEvent,
  audit?: SecurityAuditService,
  transaction?: TransactionContext,
): Promise<void> {
  const context = toRoleChangeContext(payload);
  if (payload.outcome === 'assigned') {
    logger.info(AUTHZ_ROLE_CHANGE_EVENT, context);
  } else {
    logger.warn(AUTHZ_ROLE_CHANGE_EVENT, context);
  }
  await persistSecurityAuditEvent(
    audit,
    AUTHZ_ROLE_CHANGE_EVENT,
    context,
    'authorization',
    transaction,
  );
}

export function recordC6Deny(
  logger: Logger,
  payload: C6DenyEvent,
  audit?: SecurityAuditService,
): void {
  const context = {
    event: AUTHZ_DENY_EVENT,
    outcome: 'denied',
    permission: PermissionClass.RoleAdmin,
    actorUserId: payload.actorUserId,
    role: payload.role,
    reason: payload.reason,
    ...(payload.workspaceId === undefined ? {} : { workspaceId: payload.workspaceId }),
  };
  logger.warn(AUTHZ_DENY_EVENT, context);
  void persistSecurityAuditEvent(audit, AUTHZ_DENY_EVENT, context, 'authorization');
}

export function toRoleChangeContext(payload: RoleChangeEvent): LogContext {
  const context: LogContext = {
    event: AUTHZ_ROLE_CHANGE_EVENT,
    outcome: payload.outcome,
    actorUserId: payload.actorUserId,
    subjectUserId: payload.subjectUserId,
  };
  if (payload.fromRole !== undefined) {
    context.fromRole = payload.fromRole;
  }
  if (payload.toRole !== undefined) {
    context.toRole = payload.toRole;
  }
  if (payload.reason !== undefined) {
    context.reason = payload.reason;
  }
  if (payload.workspaceId !== undefined) {
    context.workspaceId = payload.workspaceId;
  }
  return context;
}

const SENSITIVE_EVENT_PATTERN = /password|passwd|token|hash|secret|cookie|authorization|email/i;

export function authorizationEventLeaksSensitiveData(context: LogContext | undefined): boolean {
  return SENSITIVE_EVENT_PATTERN.test(JSON.stringify(context ?? {}));
}
