/**
 * FIV-CONN-04-B-03 — ConnectionsService migration-gate enforcement helpers.
 *
 * Pure functions (IMPL-COND-B03-02): matches B-01 pure-helper style.
 * Consumes MigrationGatePort.observe() + B-01 classification helpers.
 * Does not redesign B-01/B-02; does not query the lease table directly.
 */

import { ConflictException } from '@nestjs/common';
import type { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  classifyConnectionMutation,
  shouldBlockDenySetMutation,
  type ConnectionMutationMethod,
  type MigrationGateObservation,
  type MigrationGateReasonCode,
} from './migration-gate';
import type { MigrationGatePort } from './migration-gate.port';

/** D-B03-01 frozen public message — non-leaking. */
export const GATE_DENY_PUBLIC_MESSAGE =
  'This connection operation is temporarily unavailable.' as const;

export async function observeOrUnknown(
  migrationGate: MigrationGatePort,
): Promise<MigrationGateObservation> {
  try {
    const result = await migrationGate.observe();
    if (!result.ok) {
      return 'UNKNOWN';
    }
    return result.observation;
  } catch {
    return 'UNKNOWN';
  }
}

export type DenySetEnforcementInput = Readonly<{
  migrationGate: MigrationGatePort;
  audit: ConnectionMigrationGateAudit;
  method: ConnectionMutationMethod;
  connectionType?: string;
  workspaceId: string;
  actorUserId: string;
  connectionId?: string;
}>;

/**
 * Classify + observe + fail closed on deny-set when blocked.
 * Uses B-01 shouldBlockDenySetMutation / isDenySetBlocked semantics (do not duplicate).
 * Audit failure propagates → fail closed (D-B03-03).
 */
export async function assertDenySetAllowed(input: DenySetEnforcementInput): Promise<void> {
  const classification = classifyConnectionMutation({
    method: input.method,
    connectionType: input.connectionType,
  });

  if (classification.kind === 'allow') {
    return;
  }

  if (classification.kind !== 'deny') {
    // B-03 paths only call this for deny-set methods; other kinds are unexpected here.
    throw new ConflictException(GATE_DENY_PUBLIC_MESSAGE);
  }

  const observation = await observeOrUnknown(input.migrationGate);
  const decision = shouldBlockDenySetMutation(observation, classification);

  let blocked = false;
  let reasonCode: MigrationGateReasonCode | undefined;
  let blockedObservation: MigrationGateObservation = observation;

  if (!decision.ok) {
    blocked = true;
    reasonCode = decision.reason;
    blockedObservation = decision.observation ?? 'UNKNOWN';
  } else if (decision.value === 'block') {
    blocked = true;
    // IMPL-COND-B03-01: do not invent GATE_ACTIVE. ACTIVE deny relies on observation.
    if (blockedObservation === 'UNKNOWN') {
      reasonCode = 'GATE_UNKNOWN';
    }
  }

  if (!blocked) {
    return;
  }

  await input.audit.record({
    outcome: 'lifecycle_mutation_blocked',
    actorId: input.actorUserId,
    workspaceId: input.workspaceId,
    payload: {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      operation: classification.operation,
      observation: blockedObservation,
      ...(reasonCode !== undefined ? { reasonCode } : {}),
      workspaceId: input.workspaceId,
      ...(input.connectionId !== undefined ? { connectionId: input.connectionId } : {}),
      outcome: 'lifecycle_mutation_blocked',
      result: 'denied',
    },
  });

  throw new ConflictException(GATE_DENY_PUBLIC_MESSAGE);
}

/** Mid-flight re-observation after Vault I/O (store/replace/revoke). */
export async function assertDenySetAllowedAfterVault(
  input: DenySetEnforcementInput,
): Promise<void> {
  return assertDenySetAllowed(input);
}
