import { randomUUID } from 'node:crypto';
import type { DiscoveryResumeIntent } from './force-confirm-recovering';
import { TradingSessionStatus } from './trading-session-status';

/**
 * E17 §4.5 RecoveryPhase — durable progress within Session `RECOVERING`.
 * Distinct from aggregate `RecoveryStatus` (not replaced by US292).
 * Not a second Session lifecycle authority (ADR-014 Session `status` remains sole lifecycle SoT).
 */
export enum RecoveryPhase {
  RECOVERING = 'RECOVERING',
  VALIDATING = 'VALIDATING',
  RECONCILING = 'RECONCILING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export const RECOVERY_STATE_SCHEMA_VERSION = 1;

export type DurableRecoveryState = Readonly<{
  sessionId: string;
  workspaceId: string;
  recoveryId: string;
  recoveryAttempt: number;
  phase: RecoveryPhase;
  preRecoveryStatus: TradingSessionStatus;
  resumeIntent: DiscoveryResumeIntent;
  fencingToken: number | null;
  lastSemanticEventId: string | null;
  lastAttemptedPhase: RecoveryPhase | null;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  /** Correlation slot — RecoveryState may reference Incident (US293). Incident does not own RecoveryState. */
  incidentId: string | null;
  schemaVersion: number;
}>;

export type RecoveryPhaseTransitionOutcome =
  | Readonly<{ ok: true; state: DurableRecoveryState }>
  | Readonly<{ ok: false; reason: string; state: DurableRecoveryState }>;

const LEGAL_PHASE_TRANSITIONS: ReadonlyMap<RecoveryPhase, ReadonlySet<RecoveryPhase>> = new Map([
  [RecoveryPhase.RECOVERING, new Set([RecoveryPhase.VALIDATING, RecoveryPhase.FAILED])],
  [RecoveryPhase.VALIDATING, new Set([RecoveryPhase.RECONCILING, RecoveryPhase.FAILED])],
  [RecoveryPhase.RECONCILING, new Set([RecoveryPhase.READY, RecoveryPhase.FAILED])],
  [RecoveryPhase.READY, new Set([RecoveryPhase.FAILED])],
  [RecoveryPhase.FAILED, new Set()],
]);

export function isRecoveryPhase(value: unknown): value is RecoveryPhase {
  return Object.values(RecoveryPhase).includes(value as RecoveryPhase);
}

export function canAdvanceRecoveryPhase(from: RecoveryPhase, to: RecoveryPhase): boolean {
  return LEGAL_PHASE_TRANSITIONS.get(from)?.has(to) ?? false;
}

/**
 * Open durable RecoveryState at discovery/`RECOVERING` open (E17 S1 / P0-1).
 * Requires Session lifecycle already `RECOVERING` (dual-status rule).
 */
export function openDurableRecoveryState(input: {
  sessionId: string;
  workspaceId: string;
  sessionStatus: TradingSessionStatus;
  preRecoveryStatus: TradingSessionStatus;
  resumeIntent: DiscoveryResumeIntent;
  recordedAt: string;
  prior: DurableRecoveryState | null;
  fencingToken?: number | null;
}): RecoveryPhaseTransitionOutcome {
  if (input.sessionStatus !== TradingSessionStatus.RECOVERING) {
    return Object.freeze({
      ok: false,
      reason: 'session_not_recovering',
      state:
        input.prior ?? emptyRejectedState(input.sessionId, input.workspaceId, input.recordedAt),
    });
  }

  const prior =
    input.prior !== null && input.prior.sessionId === input.sessionId ? input.prior : null;

  // Idempotent confirm while still at open phase: keep durable intent authority.
  if (prior !== null && prior.completedAt === null && prior.phase === RecoveryPhase.RECOVERING) {
    return Object.freeze({
      ok: true,
      state: Object.freeze({
        ...prior,
        updatedAt: input.recordedAt,
        lastAttemptedPhase: RecoveryPhase.RECOVERING,
        fencingToken: input.fencingToken ?? prior.fencingToken,
      }),
    });
  }

  // Crash / rediscovery re-entry (or first open): always at RECOVERING (AC-6).
  // Preserve intent from incomplete prior; never skip work via lastAttemptedPhase.
  const reentry = prior !== null && prior.completedAt === null;
  return Object.freeze({
    ok: true,
    state: Object.freeze({
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      recoveryId: randomUUID(),
      recoveryAttempt: prior === null ? 1 : prior.recoveryAttempt + 1,
      phase: RecoveryPhase.RECOVERING,
      preRecoveryStatus: reentry ? prior.preRecoveryStatus : input.preRecoveryStatus,
      resumeIntent: reentry ? prior.resumeIntent : input.resumeIntent,
      fencingToken: input.fencingToken ?? null,
      lastSemanticEventId: null,
      lastAttemptedPhase: reentry ? prior.lastAttemptedPhase : RecoveryPhase.RECOVERING,
      startedAt: input.recordedAt,
      updatedAt: input.recordedAt,
      completedAt: null,
      failedAt: null,
      failureReason: null,
      incidentId: null,
      schemaVersion: RECOVERY_STATE_SCHEMA_VERSION,
    }),
  });
}

/**
 * Advance phase only via legal §4.5 transitions while Session status is `RECOVERING`
 * (except target `FAILED`, which pairs with Session FAILED at the lifecycle layer).
 */
export function advanceDurableRecoveryPhase(input: {
  state: DurableRecoveryState;
  sessionStatus: TradingSessionStatus;
  to: RecoveryPhase;
  recordedAt: string;
  fencingToken?: number | null;
  lastSemanticEventId?: string | null;
  failureReason?: string | null;
  /** US293: set when failing closed with a persisted Incident identity. */
  incidentId?: string | null;
}): RecoveryPhaseTransitionOutcome {
  const { state, to, recordedAt } = input;

  if (state.completedAt !== null) {
    return reject(state, 'already_completed');
  }

  if (to !== RecoveryPhase.FAILED && input.sessionStatus !== TradingSessionStatus.RECOVERING) {
    return reject(state, 'phase_advance_requires_session_recovering');
  }

  if (!canAdvanceRecoveryPhase(state.phase, to)) {
    return reject(state, `illegal_phase_transition:${state.phase}->${to}`);
  }

  if (to === RecoveryPhase.FAILED) {
    return Object.freeze({
      ok: true,
      state: Object.freeze({
        ...state,
        phase: RecoveryPhase.FAILED,
        lastAttemptedPhase: RecoveryPhase.FAILED,
        fencingToken: input.fencingToken ?? state.fencingToken,
        lastSemanticEventId: input.lastSemanticEventId ?? state.lastSemanticEventId,
        updatedAt: recordedAt,
        failedAt: recordedAt,
        failureReason: input.failureReason ?? 'recovery_failed',
        completedAt: null,
        incidentId: input.incidentId !== undefined ? input.incidentId : state.incidentId,
      }),
    });
  }

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...state,
      phase: to,
      lastAttemptedPhase: to,
      fencingToken: input.fencingToken ?? state.fencingToken,
      lastSemanticEventId: input.lastSemanticEventId ?? state.lastSemanticEventId,
      updatedAt: recordedAt,
      failedAt: null,
      failureReason: null,
    }),
  });
}

/** Patch fencing token while remaining in current phase (S2 lease acquire). */
export function withRecoveryFencingToken(
  state: DurableRecoveryState,
  fencingToken: number,
  recordedAt: string,
): DurableRecoveryState {
  return Object.freeze({
    ...state,
    fencingToken,
    updatedAt: recordedAt,
    lastAttemptedPhase: state.phase,
  });
}

/**
 * US293: attach Incident correlation to an already-FAILED RecoveryState
 * without inventing a phase transition (FAILED → FAILED is illegal).
 */
export function correlateIncidentOnFailedRecoveryState(input: {
  state: DurableRecoveryState;
  incidentId: string;
  recordedAt: string;
  failureReason?: string | null;
}): RecoveryPhaseTransitionOutcome {
  const { state, incidentId, recordedAt } = input;
  if (state.phase !== RecoveryPhase.FAILED) {
    return reject(state, 'correlate_incident_requires_failed_phase');
  }
  if (state.completedAt !== null) {
    return reject(state, 'already_completed');
  }
  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...state,
      incidentId,
      failureReason: input.failureReason ?? state.failureReason,
      failedAt: state.failedAt ?? recordedAt,
      updatedAt: recordedAt,
    }),
  });
}

/**
 * Finalize after successful S7-class Session exit (READY → completed).
 * Retains row for audit (soft-complete); does not delete evidence.
 */
export function finalizeDurableRecoveryState(input: {
  state: DurableRecoveryState;
  sessionStatus: TradingSessionStatus;
  recordedAt: string;
}): RecoveryPhaseTransitionOutcome {
  const { state, recordedAt } = input;

  if (state.completedAt !== null) {
    return Object.freeze({ ok: true, state });
  }

  if (state.phase !== RecoveryPhase.READY) {
    return reject(state, `finalize_requires_ready:have_${state.phase}`);
  }

  if (input.sessionStatus === TradingSessionStatus.RECOVERING) {
    return reject(state, 'finalize_requires_session_exit');
  }

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...state,
      updatedAt: recordedAt,
      completedAt: recordedAt,
      lastAttemptedPhase: RecoveryPhase.READY,
      failedAt: null,
      failureReason: null,
    }),
  });
}

function reject(state: DurableRecoveryState, reason: string): RecoveryPhaseTransitionOutcome {
  return Object.freeze({ ok: false, reason, state });
}

function emptyRejectedState(
  sessionId: string,
  workspaceId: string,
  recordedAt: string,
): DurableRecoveryState {
  return Object.freeze({
    sessionId,
    workspaceId,
    recoveryId: 'rejected',
    recoveryAttempt: 0,
    phase: RecoveryPhase.FAILED,
    preRecoveryStatus: TradingSessionStatus.FAILED,
    resumeIntent: TradingSessionStatus.STOPPED,
    fencingToken: null,
    lastSemanticEventId: null,
    lastAttemptedPhase: null,
    startedAt: recordedAt,
    updatedAt: recordedAt,
    completedAt: null,
    failedAt: recordedAt,
    failureReason: 'rejected_open',
    incidentId: null,
    schemaVersion: RECOVERY_STATE_SCHEMA_VERSION,
  });
}
