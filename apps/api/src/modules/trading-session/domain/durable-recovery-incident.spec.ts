import { describe, expect, it } from 'vitest';
import {
  advanceDurableRecoveryPhase,
  correlateIncidentOnFailedRecoveryState,
  openDurableRecoveryState,
  RecoveryPhase,
} from './durable-recovery-state';
import { TradingSessionStatus } from './trading-session-status';

const at = '2026-08-01T12:00:00.000Z';

function openState() {
  const opened = openDurableRecoveryState({
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    sessionStatus: TradingSessionStatus.RECOVERING,
    preRecoveryStatus: TradingSessionStatus.RUNNING,
    resumeIntent: TradingSessionStatus.RUNNING,
    recordedAt: at,
    prior: null,
  });
  expect(opened.ok).toBe(true);
  return opened.state;
}

describe('US293 — Incident correlation on RecoveryState', () => {
  it('sets incidentId when advancing to FAILED', () => {
    const failed = advanceDurableRecoveryPhase({
      state: openState(),
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.FAILED,
      recordedAt: at,
      failureReason: 'reconcile:mismatch',
      incidentId: 'inc-1',
    });
    expect(failed.ok).toBe(true);
    expect(failed.state.phase).toBe(RecoveryPhase.FAILED);
    expect(failed.state.incidentId).toBe('inc-1');
  });

  it('correlates Incident onto already-FAILED state without phase move', () => {
    const failed = advanceDurableRecoveryPhase({
      state: openState(),
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.FAILED,
      recordedAt: at,
      failureReason: 'lease_denied',
    });
    expect(failed.ok).toBe(true);
    expect(failed.state.incidentId).toBeNull();

    const correlated = correlateIncidentOnFailedRecoveryState({
      state: failed.state,
      incidentId: 'inc-2',
      recordedAt: '2026-08-01T12:01:00.000Z',
      failureReason: 'lease_denied:version_conflict',
    });
    expect(correlated.ok).toBe(true);
    expect(correlated.state.phase).toBe(RecoveryPhase.FAILED);
    expect(correlated.state.incidentId).toBe('inc-2');
  });

  it('rejects correlating Incident when phase is not FAILED', () => {
    const rejected = correlateIncidentOnFailedRecoveryState({
      state: openState(),
      incidentId: 'inc-3',
      recordedAt: at,
    });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.reason).toBe('correlate_incident_requires_failed_phase');
    }
  });
});
