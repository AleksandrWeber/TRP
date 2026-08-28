/**
 * W4-E02-d — Process-local Bybit Exchange Connectivity continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { BybitExchangeConnectivityRecoveryDiagnostics } from './bybit-exchange-connectivity-restart-recovery';
import { W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER } from './bybit-exchange-connectivity-restart-recovery';

export type BybitExchangeConnectivityRecoveryOutcome = 'ready' | 'unavailable';

export type BybitExchangeConnectivityOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type BybitExchangeConnectivityContinuityRecord = Readonly<{
  owner: typeof W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  outcome: BybitExchangeConnectivityRecoveryOutcome;
  ownerReadiness: BybitExchangeConnectivityOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: BybitExchangeConnectivityRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: BybitExchangeConnectivityContinuityRecord | null = null;

export function recordBybitExchangeConnectivityRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
    outcome: 'unavailable',
    ownerReadiness: 'ready',
    integrityVerified: false,
    integrityFailure: false,
    reason: 'recovering',
    diagnostics: null,
    recoveryStartedAt: new Date(atMs).toISOString(),
    recoveryCompletedAt: null,
    recoveryDurationMs: null,
  });
}

export function recordBybitExchangeConnectivityRecoverySuccess(input: {
  diagnostics: BybitExchangeConnectivityRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: BybitExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
    outcome: 'ready',
    ownerReadiness: input.ownerReadiness ?? 'ready',
    integrityVerified: true,
    integrityFailure: false,
    reason: input.reason ?? 'hydrate-ok',
    diagnostics: input.diagnostics,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

export function recordBybitExchangeConnectivityRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: BybitExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
    outcome: 'unavailable',
    ownerReadiness: input.ownerReadiness ?? 'unavailable',
    integrityVerified: false,
    integrityFailure: false,
    reason: input.reason,
    diagnostics: null,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

/** Integrity failure honesty — Degraded, never fabricates Ready. */
export function recordBybitExchangeConnectivityIntegrityFailure(reason: string): void {
  if (!record) {
    recordBybitExchangeConnectivityRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function recordBybitExchangeConnectivityOwnerReadiness(
  ownerReadiness: BybitExchangeConnectivityOwnerReadiness,
  reason?: string,
): void {
  if (record) {
    record = Object.freeze({
      ...record,
      ownerReadiness,
      reason: reason ?? record.reason,
    });
  }
}

export function getBybitExchangeConnectivityContinuityRecord(): BybitExchangeConnectivityContinuityRecord | null {
  return record;
}

export function isBybitExchangeConnectivityRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetBybitExchangeConnectivityContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
