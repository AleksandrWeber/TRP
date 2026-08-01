import { describe, expect, it } from 'vitest';
import {
  advanceDurableRecoveryPhase,
  canAdvanceRecoveryPhase,
  finalizeDurableRecoveryState,
  openDurableRecoveryState,
  RecoveryPhase,
  withRecoveryFencingToken,
  type DurableRecoveryState,
} from './durable-recovery-state';
import { TradingSessionStatus } from './trading-session-status';

const recordedAt = '2026-08-01T10:00:00.000Z';

function opened(overrides: Partial<DurableRecoveryState> = {}): DurableRecoveryState {
  const result = openDurableRecoveryState({
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    sessionStatus: TradingSessionStatus.RECOVERING,
    preRecoveryStatus: TradingSessionStatus.RUNNING,
    resumeIntent: TradingSessionStatus.RUNNING,
    recordedAt,
    prior: null,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected open');
  return Object.freeze({ ...result.state, ...overrides });
}

describe('US292 — durable RecoveryPhase machine', () => {
  it('opens RecoveryState at phase RECOVERING with explicit intent facts', () => {
    const result = openDurableRecoveryState({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      sessionStatus: TradingSessionStatus.RECOVERING,
      preRecoveryStatus: TradingSessionStatus.STOPPING,
      resumeIntent: TradingSessionStatus.STOPPED,
      recordedAt,
      prior: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe(RecoveryPhase.RECOVERING);
    expect(result.state.preRecoveryStatus).toBe(TradingSessionStatus.STOPPING);
    expect(result.state.resumeIntent).toBe(TradingSessionStatus.STOPPED);
    expect(result.state.incidentId).toBeNull();
    expect(result.state.completedAt).toBeNull();
  });

  it('rejects open when Session status is not RECOVERING', () => {
    const result = openDurableRecoveryState({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      sessionStatus: TradingSessionStatus.RUNNING,
      preRecoveryStatus: TradingSessionStatus.RUNNING,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt,
      prior: null,
    });
    expect(result.ok).toBe(false);
  });

  it('preserves STOPPED resumeIntent across idempotent reopen', () => {
    const first = opened({
      preRecoveryStatus: TradingSessionStatus.STOPPING,
      resumeIntent: TradingSessionStatus.STOPPED,
    });
    const second = openDurableRecoveryState({
      sessionId: first.sessionId,
      workspaceId: first.workspaceId,
      sessionStatus: TradingSessionStatus.RECOVERING,
      preRecoveryStatus: TradingSessionStatus.RUNNING,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: '2026-08-01T11:00:00.000Z',
      prior: first,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.state.resumeIntent).toBe(TradingSessionStatus.STOPPED);
    expect(second.state.preRecoveryStatus).toBe(TradingSessionStatus.STOPPING);
    expect(second.state.phase).toBe(RecoveryPhase.RECOVERING);
    expect(second.state.recoveryId).toBe(first.recoveryId);
  });

  it('re-enters at RECOVERING after mid-phase crash while preserving intent (AC-6)', () => {
    const mid = opened({
      phase: RecoveryPhase.RECONCILING,
      lastAttemptedPhase: RecoveryPhase.RECONCILING,
      preRecoveryStatus: TradingSessionStatus.STOPPING,
      resumeIntent: TradingSessionStatus.STOPPED,
    });
    const reentry = openDurableRecoveryState({
      sessionId: mid.sessionId,
      workspaceId: mid.workspaceId,
      sessionStatus: TradingSessionStatus.RECOVERING,
      preRecoveryStatus: TradingSessionStatus.RUNNING,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: '2026-08-01T11:30:00.000Z',
      prior: mid,
    });
    expect(reentry.ok).toBe(true);
    if (!reentry.ok) return;
    expect(reentry.state.phase).toBe(RecoveryPhase.RECOVERING);
    expect(reentry.state.resumeIntent).toBe(TradingSessionStatus.STOPPED);
    expect(reentry.state.lastAttemptedPhase).toBe(RecoveryPhase.RECONCILING);
    expect(reentry.state.recoveryAttempt).toBe(mid.recoveryAttempt + 1);
    expect(
      advanceDurableRecoveryPhase({
        state: reentry.state,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.READY,
        recordedAt,
      }).ok,
    ).toBe(false);
  });

  it('allows legal happy-path advances and records lastAttemptedPhase', () => {
    let state = opened();
    state = withRecoveryFencingToken(state, 7, recordedAt);

    const validating = advanceDurableRecoveryPhase({
      state,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.VALIDATING,
      recordedAt,
      fencingToken: 7,
    });
    expect(validating.ok).toBe(true);
    if (!validating.ok) return;

    const reconciling = advanceDurableRecoveryPhase({
      state: validating.state,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.RECONCILING,
      recordedAt,
    });
    expect(reconciling.ok).toBe(true);
    if (!reconciling.ok) return;

    const ready = advanceDurableRecoveryPhase({
      state: reconciling.state,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.READY,
      recordedAt,
      lastSemanticEventId: 'evt-1',
    });
    expect(ready.ok).toBe(true);
    if (!ready.ok) return;
    expect(ready.state.phase).toBe(RecoveryPhase.READY);
    expect(ready.state.lastAttemptedPhase).toBe(RecoveryPhase.READY);
    expect(ready.state.lastSemanticEventId).toBe('evt-1');
  });

  it('rejects illegal transitions including skip-to-READY and backward moves', () => {
    const state = opened();
    expect(canAdvanceRecoveryPhase(RecoveryPhase.RECOVERING, RecoveryPhase.READY)).toBe(false);
    expect(
      advanceDurableRecoveryPhase({
        state,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.READY,
        recordedAt,
      }).ok,
    ).toBe(false);

    const validating = advanceDurableRecoveryPhase({
      state,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.VALIDATING,
      recordedAt,
    });
    expect(validating.ok).toBe(true);
    if (!validating.ok) return;
    expect(
      advanceDurableRecoveryPhase({
        state: validating.state,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.RECOVERING,
        recordedAt,
      }).ok,
    ).toBe(false);
  });

  it('rejects phase advance when Session status is not RECOVERING', () => {
    const state = opened();
    const result = advanceDurableRecoveryPhase({
      state,
      sessionStatus: TradingSessionStatus.RUNNING,
      to: RecoveryPhase.VALIDATING,
      recordedAt,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('phase_advance_requires_session_recovering');
  });

  it('finalizes from READY after Session exit and retains audit row', () => {
    let state = opened();
    for (const to of [
      RecoveryPhase.VALIDATING,
      RecoveryPhase.RECONCILING,
      RecoveryPhase.READY,
    ] as const) {
      const next = advanceDurableRecoveryPhase({
        state,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to,
        recordedAt,
      });
      expect(next.ok).toBe(true);
      if (!next.ok) return;
      state = next.state;
    }

    const finalized = finalizeDurableRecoveryState({
      state,
      sessionStatus: TradingSessionStatus.RUNNING,
      recordedAt: '2026-08-01T12:00:00.000Z',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.state.completedAt).toBe('2026-08-01T12:00:00.000Z');
    expect(finalized.state.phase).toBe(RecoveryPhase.READY);
  });

  it('does not treat lastAttemptedPhase as authority to skip phases', () => {
    const state = opened({ lastAttemptedPhase: RecoveryPhase.RECONCILING });
    // Re-entry still starts at RECOVERING; skip to READY remains illegal.
    expect(
      advanceDurableRecoveryPhase({
        state,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.READY,
        recordedAt,
      }).ok,
    ).toBe(false);
    expect(
      advanceDurableRecoveryPhase({
        state,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.VALIDATING,
        recordedAt,
      }).ok,
    ).toBe(true);
  });

  it('allows FAILED from active phases without requiring incidentId', () => {
    const state = opened();
    const failed = advanceDurableRecoveryPhase({
      state,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.FAILED,
      recordedAt,
      failureReason: 'lease_denied',
    });
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.state.phase).toBe(RecoveryPhase.FAILED);
    expect(failed.state.incidentId).toBeNull();
    expect(failed.state.failureReason).toBe('lease_denied');
    expect(
      advanceDurableRecoveryPhase({
        state: failed.state,
        sessionStatus: TradingSessionStatus.FAILED,
        to: RecoveryPhase.READY,
        recordedAt,
      }).ok,
    ).toBe(false);
  });
});
