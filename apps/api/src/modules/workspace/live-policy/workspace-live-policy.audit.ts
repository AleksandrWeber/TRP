import type { LogContext, Logger } from '../../../logging/logger';
import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { SecurityAuditService } from '../../security-audit/security-audit.service';
import { persistSecurityAuditEvent } from '../../security-audit/security-audit-persist';

/**
 * PROPOSED-V3-L01-S03 — Workspace live-policy Security Audit helper.
 * Reuses V3 Security Audit (classified / append-only / integrity-hashed).
 * Successful transitions only — no-ops and authz failures do not emit this event.
 */

export const AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT = 'authz.workspace-live-policy-change';

export type WorkspaceLivePolicyChangeOutcome = 'changed';

export type WorkspaceLivePolicyChangeEvent = {
  outcome: WorkspaceLivePolicyChangeOutcome;
  actorUserId: string;
  workspaceId: string;
  fromPolicy: string;
  toPolicy: string;
  correlationId?: string;
};

export async function recordWorkspaceLivePolicyChange(
  logger: Logger,
  payload: WorkspaceLivePolicyChangeEvent,
  audit?: SecurityAuditService,
  transaction?: TransactionContext,
): Promise<void> {
  const context = toWorkspaceLivePolicyChangeContext(payload);
  logger.info(AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT, context);
  await persistSecurityAuditEvent(
    audit,
    AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT,
    context,
    'authorization',
    transaction,
  );
}

export function toWorkspaceLivePolicyChangeContext(
  payload: WorkspaceLivePolicyChangeEvent,
): LogContext {
  const context: LogContext = {
    event: AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT,
    outcome: payload.outcome,
    actorUserId: payload.actorUserId,
    workspaceId: payload.workspaceId,
    fromPolicy: payload.fromPolicy,
    toPolicy: payload.toPolicy,
  };
  if (payload.correlationId !== undefined && payload.correlationId.trim().length > 0) {
    context.correlationId = payload.correlationId.trim();
  }
  return context;
}
