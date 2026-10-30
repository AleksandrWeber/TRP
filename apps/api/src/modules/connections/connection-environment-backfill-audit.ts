/**
 * FIV-CONN-04-D Stage 2 — Connections-local audit helper for
 * `connection.environment-backfill` (COND-IA-04 / D-CONN04-FULL-D-IA-S23-B).
 *
 * Mirrors ConnectionMigrationGateAudit: sanitize → SecurityAuditService.record
 * with optional TransactionContext. Does not construct PrivilegedActorContext.
 * Does not perform Connection.environment UPDATE or backfill orchestration.
 */

import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';

/** Ratified event type — character-for-character (COND-IA-04 / PD03-NB01). */
export const ENVIRONMENT_BACKFILL_AUDIT_EVENT_TYPE = 'connection.environment-backfill' as const;

/**
 * Parent Slice Planning Package §13 outcome taxonomy (minimum).
 * Disposition→outcome naming detail remains deferred; these codes are the floor.
 */
export type EnvironmentBackfillAuditOutcome =
  | 'updated_live'
  | 'blocked_ambiguity'
  | 'blocked_missing_or_dangling'
  | 'blocked_revoked_or_invalid'
  | 'blocked_workspace_mismatch'
  | 'blocked_purpose_env_mismatch'
  | 'blocked_strategy_b_collision'
  | 'skipped_no_longer_eligible'
  | 'operation_summary';

/**
 * Parent Slice §13 safe payload fields that also clear the established
 * SecurityAuditService sensitive-key boundary (keys matching /secret/i refuse).
 * Opaque `vaultSecretId` is §13-allowed but blocked by that shared boundary;
 * Stage 2 does not amend SecurityAuditService — callers must omit it.
 */
const SAFE_PAYLOAD_KEYS = Object.freeze(
  new Set([
    'connectionId',
    'workspaceId',
    'provider',
    'connectionType',
    'previousEnvironment',
    'newEnvironment',
    'evidenceClass',
    'vaultPurpose',
    'actorId',
    'systemJobId',
    'correlationId',
    'timestamp',
    'outcome',
    'reasonCode',
    'scanned',
    'eligible',
    'updated',
    'blocked',
    'skipped',
    'ambiguous',
    'defective',
    'collision',
    'errors',
    'already_populated',
    'non_exchange_null',
  ]),
);

/**
 * Aligns with SecurityAuditService SENSITIVE_KEY plus §13 Forbidden substance.
 * Also rejects vaultSecretId so Stage 2 does not attempt a shared-boundary bypass.
 */
const FORBIDDEN_PAYLOAD_KEY =
  /password|passwd|token|hash|secret|cookie|authorization|credential|wrapping|ciphertext|apiKey|apikey/i;

export type EnvironmentBackfillAuditSanitizeResult =
  | { readonly ok: true; readonly value: Readonly<Record<string, unknown>> }
  | { readonly ok: false; readonly reason: string };

export function sanitizeEnvironmentBackfillAuditPayload(
  payload: Readonly<Record<string, unknown>>,
): EnvironmentBackfillAuditSanitizeResult {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_PAYLOAD_KEY.test(key)) {
      return {
        ok: false,
        reason: `forbidden or sensitive payload key: ${key}`,
      };
    }
    if (!SAFE_PAYLOAD_KEYS.has(key)) {
      continue;
    }
    safe[key] = value;
  }
  return { ok: true, value: Object.freeze(safe) };
}

@Injectable()
export class ConnectionEnvironmentBackfillAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(
    input: {
      outcome: EnvironmentBackfillAuditOutcome;
      /** Canonical SYSTEM_JOB actorId on the SYSTEM_JOB path (COND-IA-04). */
      actorId: string;
      workspaceId: string;
      /** Investigation resource — typically `connection` for per-row events. */
      resourceType: string;
      /** Investigation resource id — typically connectionId for per-row events. */
      resourceId: string;
      payload: Readonly<Record<string, unknown>>;
      correlationId?: string;
    },
    transaction?: TransactionContext,
  ): Promise<void> {
    const sanitized = sanitizeEnvironmentBackfillAuditPayload(input.payload);
    if (!sanitized.ok) {
      throw new Error(`Environment-backfill audit payload rejected: ${sanitized.reason}`);
    }
    await this.audit.record(
      {
        eventType: ENVIRONMENT_BACKFILL_AUDIT_EVENT_TYPE,
        outcome: input.outcome,
        source: 'connections',
        attribution: {
          workspaceId: input.workspaceId,
          actorId: input.actorId,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
        },
        ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
        payload: sanitized.value,
      },
      transaction,
    );
  }
}
