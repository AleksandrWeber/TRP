/**
 * W4-E01-d — Process-local Exchange Connectivity continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { ExchangeConnectivityRecoveryDiagnostics } from './exchange-connectivity-restart-recovery';
import { W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER } from './exchange-connectivity-restart-recovery';

export type ExchangeConnectivityRecoveryOutcome = 'ready' | 'unavailable';

export type ExchangeConnectivityOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type ExchangeConnectivityContinuityRecord = Readonly<{
  owner: typeof W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  outcome: ExchangeConnectivityRecoveryOutcome;
  ownerReadiness: ExchangeConnectivityOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: ExchangeConnectivityRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: ExchangeConnectivityContinuityRecord | null = null;

export function recordExchangeConnectivityRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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

export function recordExchangeConnectivityRecoverySuccess(input: {
  diagnostics: ExchangeConnectivityRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: ExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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

export function recordExchangeConnectivityRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: ExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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
export function recordExchangeConnectivityIntegrityFailure(reason: string): void {
  if (!record) {
    recordExchangeConnectivityRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function recordExchangeConnectivityOwnerReadiness(
  ownerReadiness: ExchangeConnectivityOwnerReadiness,
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

export function getExchangeConnectivityContinuityRecord(): ExchangeConnectivityContinuityRecord | null {
  return record;
}

export function isExchangeConnectivityRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetExchangeConnectivityContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
