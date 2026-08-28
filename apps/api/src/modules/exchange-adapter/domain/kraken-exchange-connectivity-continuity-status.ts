/**
 * W4-E04-d — Process-local Kraken Exchange Connectivity continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { KrakenExchangeConnectivityRecoveryDiagnostics } from './kraken-exchange-connectivity-restart-recovery';
import { W4_E04_C_KRAKEN_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER } from './kraken-exchange-connectivity-restart-recovery';

export type KrakenExchangeConnectivityRecoveryOutcome = 'ready' | 'unavailable';

export type KrakenExchangeConnectivityOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type KrakenExchangeConnectivityContinuityRecord = Readonly<{
  owner: typeof W4_E04_C_KRAKEN_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  outcome: KrakenExchangeConnectivityRecoveryOutcome;
  ownerReadiness: KrakenExchangeConnectivityOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: KrakenExchangeConnectivityRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: KrakenExchangeConnectivityContinuityRecord | null = null;

export function recordKrakenExchangeConnectivityRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W4_E04_C_KRAKEN_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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

export function recordKrakenExchangeConnectivityRecoverySuccess(input: {
  diagnostics: KrakenExchangeConnectivityRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: KrakenExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E04_C_KRAKEN_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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

export function recordKrakenExchangeConnectivityRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: KrakenExchangeConnectivityOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E04_C_KRAKEN_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
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
export function recordKrakenExchangeConnectivityIntegrityFailure(reason: string): void {
  if (!record) {
    recordKrakenExchangeConnectivityRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function recordKrakenExchangeConnectivityOwnerReadiness(
  ownerReadiness: KrakenExchangeConnectivityOwnerReadiness,
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

export function getKrakenExchangeConnectivityContinuityRecord(): KrakenExchangeConnectivityContinuityRecord | null {
  return record;
}

export function isKrakenExchangeConnectivityRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetKrakenExchangeConnectivityContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
