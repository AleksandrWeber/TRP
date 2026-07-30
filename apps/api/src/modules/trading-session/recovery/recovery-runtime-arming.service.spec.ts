import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeWorkerState, type StrategyRuntimePort } from '../../strategy-runtime';
import {
  RecoveryEventAdmissionOperationalState,
  type RecoveryEventAdmissionResult,
} from '../domain/recovery-event-admission';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import type { RecoveryEventAdmissionPolicy } from '../ports/recovery-event-admission-policy.port';
import type { RecoveryEventAdmissionService } from './recovery-event-admission.service';
import { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';

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

function session(overrides: Partial<{ status: TradingSessionStatus; expiresAt: string }> = {}) {
  return {
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy' as const,
    status: overrides.status ?? TradingSessionStatus.RECOVERING,
    lease: {
      ownerId: 'runtime-a',
      fencingToken: 4,
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

describe('US246 — RecoveryRuntimeArmingService', () => {
  const loadContext = vi.fn();
  const getLifecycle = vi.fn();
  const getDiagnostics = vi.fn();
  const arm = vi.fn();
  const enableEventAdmission = vi.fn();
  const resumeRuntime = vi.fn();
  const admitTick = vi.fn();
  const evaluate = vi.fn();
  const emitSignalIntent = vi.fn();
  const saveCheckpoint = vi.fn();

  const runtime = {
    loadContext,
    getLifecycle,
    getDiagnostics,
    arm,
    enableEventAdmission,
    pause: vi.fn(),
    resume: resumeRuntime,
    stop: vi.fn(),
    admitTick,
    evaluate,
    emitSignalIntent,
    listSignalIntents: vi.fn(),
    saveCheckpoint,
    loadCheckpoint: vi.fn(),
  } as unknown as StrategyRuntimePort;

  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    saveIfVersion: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByStatuses: vi.fn(),
  };

  const admissionService = {
    getLastResult: vi.fn(),
  };

  const policy = {
    isKillSwitchActive: vi.fn(),
  };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoveryRuntimeArmingService;

  beforeEach(() => {
    vi.clearAllMocks();
    info = vi.fn();
    const logger = {
      info,
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    logger.child.mockReturnValue(logger);

    service = new RecoveryRuntimeArmingService(
      runtime,
      sessions,
      admissionService as unknown as RecoveryEventAdmissionService,
      policy as unknown as RecoveryEventAdmissionPolicy,
      logger as never,
    );

    vi.mocked(admissionService.getLastResult).mockReturnValue(admission());
    vi.mocked(sessions.findById).mockResolvedValue(session() as never);
    vi.mocked(policy.isKillSwitchActive).mockResolvedValue(false);
    vi.mocked(arm).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      toState: RuntimeWorkerState.ARMED,
      drained: false,
      reason: 'recovery runtime armed',
    } as never);
    vi.mocked(getLifecycle)
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        fencingToken: 4,
        acceptsTicks: true,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.ARMED,
        fencingToken: 4,
        acceptsTicks: true,
        draining: false,
      });
    vi.mocked(getDiagnostics)
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        deploymentId: 'deployment-1',
        checkpointVersion: 3,
        lastProcessedEventId: 'evt-10',
        lastProcessedCandleSequence: 10,
        runtimeVersion: '1',
        evaluationEnabled: true,
        workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        acceptsTicks: true,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        deploymentId: 'deployment-1',
        checkpointVersion: 3,
        lastProcessedEventId: 'evt-10',
        lastProcessedCandleSequence: 10,
        runtimeVersion: '1',
        evaluationEnabled: true,
        workerState: RuntimeWorkerState.ARMED,
        acceptsTicks: true,
      });
  });

  it('arms successfully without strategy evaluation or Order path activity', async () => {
    const result = await service.arm(at);

    expect(result.outcome).toBe('ARMED');
    expect(result.armedState?.operationalState).toBe('ARMED');
    expect(arm).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        fencingToken: 4,
        reason: 'recovery runtime armed',
      }),
    );
    expect(enableEventAdmission).not.toHaveBeenCalled();
    expect(resumeRuntime).not.toHaveBeenCalled();
    expect(admitTick).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
    expect(emitSignalIntent).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_runtime_arming',
      expect.objectContaining({ outcome: 'ARMED', reason: 'runtime_armed' }),
    );
  });

  it('blocks duplicate arming', async () => {
    const first = await service.arm(at);
    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      fencingToken: 4,
      acceptsTicks: true,
      draining: false,
    });
    vi.mocked(getDiagnostics).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-10',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      acceptsTicks: true,
    });

    const second = await service.arm(at);

    expect(first.outcome).toBe('ARMED');
    expect(second.outcome).toBe('ARMING_BLOCKED');
    expect(second.reason).toBe('already_armed');
    expect(arm).toHaveBeenCalledOnce();
  });

  it('blocks expired lease, active kill switch, and missing admission', async () => {
    vi.mocked(sessions.findById).mockResolvedValueOnce(
      session({ expiresAt: '2026-07-30T17:59:59.000Z' }) as never,
    );
    const expired = await service.arm(at);
    expect(expired.reason).toBe('lease_expired');
    expect(arm).not.toHaveBeenCalled();

    vi.mocked(sessions.findById).mockResolvedValue(session() as never);
    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      fencingToken: 4,
      acceptsTicks: true,
      draining: false,
    });
    vi.mocked(getDiagnostics).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-10',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      acceptsTicks: true,
    });
    vi.mocked(policy.isKillSwitchActive).mockResolvedValueOnce(true);
    const stoppedByKillSwitch = await service.arm(at);
    expect(stoppedByKillSwitch.reason).toBe('kill_switch_active');

    vi.mocked(policy.isKillSwitchActive).mockResolvedValue(false);
    vi.mocked(admissionService.getLastResult).mockReturnValueOnce({
      ...admission(),
      outcome: 'ADMISSION_BLOCKED',
      reason: 'runtime_not_ready',
      enabledState: null,
    });
    const notAdmitted = await service.arm(at);
    expect(notAdmitted.reason).toBe('event_admission_not_enabled');
  });

  it('blocks invalid lifecycle and runtime identity mismatch before arming', async () => {
    vi.mocked(getLifecycle).mockReset();
    vi.mocked(getDiagnostics).mockReset();
    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.IDLE,
      fencingToken: 4,
      acceptsTicks: false,
      draining: false,
    });
    vi.mocked(getDiagnostics).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-10',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.IDLE,
      acceptsTicks: false,
    });

    const invalid = await service.arm(at);
    expect(invalid.outcome).toBe('ARMING_BLOCKED');
    expect(invalid.reason).toBe('invalid_lifecycle');
    expect(arm).not.toHaveBeenCalled();

    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      fencingToken: 4,
      acceptsTicks: true,
      draining: false,
    });
    vi.mocked(getDiagnostics).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'other-deployment',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-10',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      acceptsTicks: true,
    });

    const mismatch = await service.arm(at);
    expect(mismatch.reason).toBe('runtime_identity_mismatch');
    expect(arm).not.toHaveBeenCalled();
  });
});
