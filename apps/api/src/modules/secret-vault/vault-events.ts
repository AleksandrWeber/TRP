import type { LogContext, Logger } from '../../logging/logger';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import type { SecurityAuditService } from '../security-audit/security-audit.service';
import { persistSecurityAuditEvent } from '../security-audit/security-audit-persist';

export const VAULT_LIFECYCLE_EVENT = 'vault.lifecycle';
export const VAULT_ACCESS_DENIED_EVENT = 'vault.access-denied';

export type VaultLifecycleOutcome = 'created' | 'replaced' | 'revoked' | 'deleted';

export type VaultLifecycleEvent = Readonly<{
  outcome: VaultLifecycleOutcome;
  actorUserId: string;
  workspaceId: string;
  type: string;
  purpose: string;
}>;

/**
 * Structured Vault security events (V3-S03 / V3-S05-a).
 * Vault owns lifecycle facts; Security Audit persists them. No secret material.
 */
export async function recordVaultLifecycle(
  logger: Logger,
  payload: VaultLifecycleEvent,
  audit?: SecurityAuditService,
  transaction?: TransactionContext,
): Promise<void> {
  const context: LogContext = {
    event: VAULT_LIFECYCLE_EVENT,
    outcome: payload.outcome,
    actorUserId: payload.actorUserId,
    workspaceId: payload.workspaceId,
    type: payload.type,
    purpose: payload.purpose,
  };
  logger.info(VAULT_LIFECYCLE_EVENT, context);
  await persistSecurityAuditEvent(audit, VAULT_LIFECYCLE_EVENT, context, 'vault', transaction);
}

export function recordVaultAccessDenied(
  logger: Logger,
  payload: Readonly<{ actorUserId: string; workspaceId: string }>,
  audit?: SecurityAuditService,
): void {
  const context: LogContext = {
    event: VAULT_ACCESS_DENIED_EVENT,
    outcome: 'denied',
    actorUserId: payload.actorUserId,
    workspaceId: payload.workspaceId,
    type: 'unknown',
    purpose: 'unknown',
  };
  logger.warn(VAULT_ACCESS_DENIED_EVENT, context);
  void persistSecurityAuditEvent(audit, VAULT_ACCESS_DENIED_EVENT, context, 'vault');
}
