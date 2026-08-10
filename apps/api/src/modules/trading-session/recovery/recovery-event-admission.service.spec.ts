import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeWorkerState, type StrategyRuntimePort } from '../../strategy-runtime';
import {
  RecoveryRuntimeOperationalState,
  type RecoveryRuntimeResumeResult,
} from '../domain/recovery-runtime-resume';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import type { RecoveryEventAdmissionPolicy } from '../ports/recovery-event-admission-policy.port';
import type { RecoveryRuntimeResumeService } from './recovery-runtime-resume.service';
import { RecoveryEventAdmissionService } from './recovery-event-admission.service';

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

describe('US245 — RecoveryEventAdmissionService', () => {
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
    findByWorkspaceId: vi.fn(),
    findByStatuses: vi.fn(),
  };

  const resume = {
    getLastResult: vi.fn(),
  };

  const policy = {
    isKillSwitchActive: vi.fn(),
  };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoveryEventAdmissionService;

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

    service = new RecoveryEventAdmissionService(
      runtime,
      sessions,
      resume as unknown as RecoveryRuntimeResumeService,
      policy as unknown as RecoveryEventAdmissionPolicy,
      logger as never,
    );

    vi.mocked(resume.getLastResult).mockReturnValue(ready());
    vi.mocked(sessions.findById).mockResolvedValue(session() as never);
    vi.mocked(policy.isKillSwitchActive).mockResolvedValue(false);
    vi.mocked(enableEventAdmission).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.IDLE,
      toState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      drained: false,
      reason: 'recovery event admission enabled',
    } as never);
    vi.mocked(getLifecycle)
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.IDLE,
        fencingToken: 4,
        acceptsTicks: false,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
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
        workerState: RuntimeWorkerState.IDLE,
        acceptsTicks: false,
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
        workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        acceptsTicks: true,
      });
  });

  it('enables event admission successfully without business execution', async () => {
    const result = await service.enable(at);

    expect(result.outcome).toBe('EVENT_ADMISSION_ENABLED');
    expect(result.enabledState?.operationalState).toBe('EVENT_ADMISSION_ENABLED');
    expect(enableEventAdmission).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        fencingToken: 4,
      }),
    );
    expect(arm).not.toHaveBeenCalled();
    expect(resumeRuntime).not.toHaveBeenCalled();
    expect(admitTick).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
    expect(emitSignalIntent).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
  });

  it('blocks duplicate admission', async () => {
    const first = await service.enable(at);
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

    const second = await service.enable(at);

    expect(first.outcome).toBe('EVENT_ADMISSION_ENABLED');
    expect(second.outcome).toBe('ADMISSION_BLOCKED');
    expect(second.reason).toBe('already_admitted');
    expect(enableEventAdmission).toHaveBeenCalledOnce();
  });

  it('blocks expired lease, active kill switch, and non-READY runtime', async () => {
    vi.mocked(sessions.findById).mockResolvedValueOnce(
      session({ expiresAt: '2026-07-30T17:59:59.000Z' }) as never,
    );
    const expired = await service.enable(at);
    expect(expired.reason).toBe('lease_expired');
    expect(enableEventAdmission).not.toHaveBeenCalled();

    vi.mocked(sessions.findById).mockResolvedValue(session() as never);
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
    vi.mocked(policy.isKillSwitchActive).mockResolvedValueOnce(true);
    const stoppedByKillSwitch = await service.enable(at);
    expect(stoppedByKillSwitch.reason).toBe('kill_switch_active');

    vi.mocked(policy.isKillSwitchActive).mockResolvedValue(false);
    vi.mocked(resume.getLastResult).mockReturnValueOnce({
      ...ready(),
      outcome: 'RESUME_BLOCKED',
      reason: 'runtime_not_idle',
      readyState: null,
    });
    const notReady = await service.enable(at);
    expect(notReady.reason).toBe('runtime_not_ready');
  });

  it('blocks invalid worker state before admission', async () => {
    vi.mocked(getLifecycle).mockReset();
    vi.mocked(getDiagnostics).mockReset();
    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.ARMED,
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
      workerState: RuntimeWorkerState.ARMED,
      acceptsTicks: true,
    });

    const result = await service.enable(at);

    expect(result.outcome).toBe('ADMISSION_BLOCKED');
    expect(result.reason).toBe('runtime_not_idle');
    expect(enableEventAdmission).not.toHaveBeenCalled();
  });
});
