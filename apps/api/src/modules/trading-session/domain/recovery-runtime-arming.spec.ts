import { describe, expect, it } from 'vitest';
import {
  RuntimeWorkerState,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime';
import {
  RecoveryEventAdmissionOperationalState,
  type RecoveryEventAdmissionResult,
} from './recovery-event-admission';
import {
  RecoveryRuntimeArmingOperationalState,
  decideRecoveryRuntimeArming,
} from './recovery-runtime-arming';
import { TradingSessionStatus } from './trading-session-status';

const at = '2026-07-30T18:00:00.000Z';

function admission(): RecoveryEventAdmissionResult {
  return {
    outcome: 'EVENT_ADMISSION_ENABLED',
    reason: 'event_admission_enabled',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    enabledState: {
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
    state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
    fencingToken: 4,
    acceptsTicks: true,
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
    workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
    acceptsTicks: true,
    ...overrides,
  };
}

describe('US246 — recovery runtime arming (pure)', () => {
  it('arms from EVENT_ADMISSION_ENABLED when gates pass', () => {
    const result = decideRecoveryRuntimeArming({
      admission: admission(),
      session: session(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      killSwitchActive: false,
      alreadyArmed: false,
      nowIso: at,
    });

    expect(result.outcome).toBe('ARMED');
    expect(result.armedState).toEqual({
      operationalState: RecoveryRuntimeArmingOperationalState.ARMED,
      workerState: RuntimeWorkerState.ARMED,
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

  it('blocks duplicate arming', () => {
    const result = decideRecoveryRuntimeArming({
      admission: admission(),
      session: session(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      killSwitchActive: false,
      alreadyArmed: true,
      nowIso: at,
    });

    expect(result.outcome).toBe('ARMING_BLOCKED');
    expect(result.reason).toBe('already_armed');
  });

  it('blocks expired lease, kill switch, invalid lifecycle, and identity mismatch', () => {
    expect(
      decideRecoveryRuntimeArming({
        admission: admission(),
        session: session({ expiresAt: '2026-07-30T17:59:59.000Z' }),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        killSwitchActive: false,
        alreadyArmed: false,
        nowIso: at,
      }).reason,
    ).toBe('lease_expired');

    expect(
      decideRecoveryRuntimeArming({
        admission: admission(),
        session: session(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        killSwitchActive: true,
        alreadyArmed: false,
        nowIso: at,
      }).reason,
    ).toBe('kill_switch_active');

    expect(
      decideRecoveryRuntimeArming({
        admission: {
          ...admission(),
          outcome: 'ADMISSION_BLOCKED',
          reason: 'runtime_not_ready',
          enabledState: null,
        },
        session: session(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        killSwitchActive: false,
        alreadyArmed: false,
        nowIso: at,
      }).reason,
    ).toBe('event_admission_not_enabled');

    expect(
      decideRecoveryRuntimeArming({
        admission: admission(),
        session: session(),
        lifecycle: lifecycle({ state: RuntimeWorkerState.IDLE, acceptsTicks: false }),
        diagnostics: diagnostics(),
        killSwitchActive: false,
        alreadyArmed: false,
        nowIso: at,
      }).reason,
    ).toBe('invalid_lifecycle');

    expect(
      decideRecoveryRuntimeArming({
        admission: admission(),
        session: session(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics({ deploymentId: 'other-deployment' }),
        killSwitchActive: false,
        alreadyArmed: false,
        nowIso: at,
      }).reason,
    ).toBe('runtime_identity_mismatch');
  });
});
