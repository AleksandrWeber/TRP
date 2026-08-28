/**
 * W4-E03-d — Process-local Okx Exchange Connectivity continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { OkxExchangeConnectivityRecoveryDiagnostics } from './okx-exchange-connectivity-restart-recovery';
import { W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER } from './okx-exchange-connectivity-restart-recovery';

export type OkxExchangeConnectivityRecoveryOutcome = 'ready' | 'unavailable';

export type OkxExchangeConnectivityOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type OkxExchangeConnectivityContinuityRecord = Readonly<{
  owner: typeof W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  outcome: OkxExchangeConnectivityRecoveryOutcome;
  ownerReadiness: OkxExchangeConnectivityOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: OkxExchangeConnectivityRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: OkxExchangeConnectivityContinuityRecord | null = null;

export function recordOkxExchangeConnectivityRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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

export function recordOkxExchangeConnectivityRecoverySuccess(input: {
  diagnostics: OkxExchangeConnectivityRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: OkxExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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

export function recordOkxExchangeConnectivityRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: OkxExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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
export function recordOkxExchangeConnectivityIntegrityFailure(reason: string): void {
  if (!record) {
    recordOkxExchangeConnectivityRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function recordOkxExchangeConnectivityOwnerReadiness(
  ownerReadiness: OkxExchangeConnectivityOwnerReadiness,
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

export function getOkxExchangeConnectivityContinuityRecord(): OkxExchangeConnectivityContinuityRecord | null {
  return record;
}

export function isOkxExchangeConnectivityRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetOkxExchangeConnectivityContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
