import { describe, expect, it } from 'vitest';
import {
  RuntimeWorkerState,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime';
import {
  RecoveryEventAdmissionOperationalState,
  decideRecoveryEventAdmission,
} from './recovery-event-admission';
import {
  RecoveryRuntimeOperationalState,
  type RecoveryRuntimeResumeResult,
} from './recovery-runtime-resume';
import { TradingSessionStatus } from './trading-session-status';

const at = '2026-07-30T18:00:00.000Z';

function ready(): RecoveryRuntimeResumeResult {
  return {
    outcome: 'READY',
    reason: 'ready',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    readyState: {
      operationalState: RecoveryRuntimeOperationalState.READY,
      workerState: RuntimeWorkerState.IDLE,
      acceptsTicks: false,
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      fencingToken: 4,
      checkpointEventId: 'evt-10',
      checkpointSequence: 10,
      checkpointVersion: 3,
      runtimeVersion: '1',
    },
  };
}

function session(
  overrides: Partial<{
    status: TradingSessionStatus;
    expiresAt: string;
    fencingToken: number;
  }> = {},
) {
  return {
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy' as const,
    status: overrides.status ?? TradingSessionStatus.RECOVERING,
    lease: {
      ownerId: 'runtime-a',
      fencingToken: overrides.fencingToken ?? 4,
      acquiredAt: '2026-07-30T17:55:00.000Z',
      expiresAt: overrides.expiresAt ?? '2026-07-30T18:05:00.000Z',
      heartbeatAt: '2026-07-30T17:59:00.000Z',
    },
    lastFencingToken: 4,
    version: 3,
    failureReason: null,
    createdAt: '2026-07-30T17:00:00.000Z',
    recordedAt: '2026-07-30T17:59:00.000Z',
    actorId: 'actor-1',
    correlationId: null,
    idempotencyKey: 'idem-1',
  };
}

function lifecycle(overrides: Partial<RuntimeLifecycleSnapshot> = {}): RuntimeLifecycleSnapshot {
  return {
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    state: RuntimeWorkerState.IDLE,
    fencingToken: 4,
    acceptsTicks: false,
    draining: false,
    ...overrides,
  };
}

function diagnostics(overrides: Partial<RuntimeDiagnostics> = {}): RuntimeDiagnostics {
  return {
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    deploymentId: 'deployment-1',
    checkpointVersion: 3,
    lastProcessedEventId: 'evt-10',
    lastProcessedCandleSequence: 10,
    runtimeVersion: '1',
    evaluationEnabled: true as const,
    workerState: RuntimeWorkerState.IDLE,
    acceptsTicks: false,
    ...overrides,
  };
}

describe('US245 — recovery event admission (pure)', () => {
  it('enables event admission from READY when gates pass', () => {
    const result = decideRecoveryEventAdmission({
      ready: ready(),
      session: session(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      killSwitchActive: false,
      alreadyAdmitted: false,
      nowIso: at,
    });

    expect(result.outcome).toBe('EVENT_ADMISSION_ENABLED');
    expect(result.enabledState).toEqual({
      operationalState: RecoveryEventAdmissionOperationalState.EVENT_ADMISSION_ENABLED,
      workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      acceptsTicks: true,
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      fencingToken: 4,
      checkpointEventId: 'evt-10',
      checkpointSequence: 10,
      checkpointVersion: 3,
      runtimeVersion: '1',
    });
  });

  it('blocks duplicate admission', () => {
    const result = decideRecoveryEventAdmission({
      ready: ready(),
      session: session(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      killSwitchActive: false,
      alreadyAdmitted: true,
      nowIso: at,
    });

    expect(result.outcome).toBe('ADMISSION_BLOCKED');
    expect(result.reason).toBe('already_admitted');
  });

  it('blocks expired lease, kill switch, non-ready runtime, and invalid worker state', () => {
    expect(
      decideRecoveryEventAdmission({
        ready: ready(),
        session: session({ expiresAt: '2026-07-30T17:59:59.000Z' }),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        killSwitchActive: false,
        alreadyAdmitted: false,
        nowIso: at,
      }).reason,
    ).toBe('lease_expired');

    expect(
      decideRecoveryEventAdmission({
        ready: ready(),
        session: session(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        killSwitchActive: true,
        alreadyAdmitted: false,
        nowIso: at,
      }).reason,
    ).toBe('kill_switch_active');

    expect(
      decideRecoveryEventAdmission({
        ready: {
          ...ready(),
          outcome: 'RESUME_BLOCKED',
          reason: 'runtime_not_idle',
          readyState: null,
        },
        session: session(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        killSwitchActive: false,
        alreadyAdmitted: false,
        nowIso: at,
      }).reason,
    ).toBe('runtime_not_ready');

    expect(
      decideRecoveryEventAdmission({
        ready: ready(),
        session: session(),
        lifecycle: lifecycle({ state: RuntimeWorkerState.ARMED, acceptsTicks: true }),
        diagnostics: diagnostics(),
        killSwitchActive: false,
        alreadyAdmitted: false,
        nowIso: at,
      }).reason,
    ).toBe('runtime_not_idle');
  });
});
