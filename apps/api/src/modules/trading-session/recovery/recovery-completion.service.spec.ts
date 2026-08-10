import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  SignalIntentDirection,
} from '../../strategy-runtime';
import { TradingSessionStatus } from '../domain/trading-session-status';
import { createTradingSession, transitionSession, attachLease } from '../domain/trading-session';
import { createSessionLease } from '../domain/session-lease';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import { RecoveryCompletionService } from './recovery-completion.service';

const at = '2026-07-30T20:00:00.000Z';
const earlier = '2026-07-30T19:00:00.000Z';

function recoveringSession() {
  let session = createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: 'idem-complete-svc-1',
    createdAt: earlier,
    recordedAt: earlier,
  });
  session = transitionSession(session, TradingSessionStatus.STARTING, earlier);
  session = transitionSession(session, TradingSessionStatus.RUNNING, earlier);
  session = transitionSession(session, TradingSessionStatus.RECOVERING, earlier);
  return attachLease(
    session,
    createSessionLease({
      ownerId: 'runtime-a',
      previousToken: 3,
      acquiredAt: earlier,
      expiresAt: '2026-07-30T20:05:00.000Z',
    }),
  );
}

describe('US249 — RecoveryCompletionService', () => {
  const findById = vi.fn();
  const saveIfVersion = vi.fn();
  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    saveIfVersion,
    findById,
    findByIdempotencyKey: vi.fn(),
    findByWorkspaceId: vi.fn(),
    findByStatuses: vi.fn(),
  };

  const getLifecycle = vi.fn();
  const runtime = {
    getLifecycle,
    getDiagnostics: vi.fn(),
    loadContext: vi.fn(),
    arm: vi.fn(),
    enableEventAdmission: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    admitTick: vi.fn(),
    evaluate: vi.fn(),
    emitSignalIntent: vi.fn(),
    listSignalIntents: vi.fn(),
    saveCheckpoint: vi.fn(),
    loadCheckpoint: vi.fn(),
  };

  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = { append: vi.fn(async () => undefined) };

  const discovery = { getLastResult: vi.fn() };
  const lease = { getLastResult: vi.fn() };
  const checkpoint = { getLastResult: vi.fn() };
  const reconcile = { getLastResult: vi.fn() };
  const resume = { getLastResult: vi.fn() };
  const admission = { getLastResult: vi.fn() };
  const arming = { getLastResult: vi.fn() };
  const evaluation = { getLastResult: vi.fn() };
  const signalIntent = { getLastResult: vi.fn() };

  let info: ReturnType<typeof vi.fn>;
  const recoveryProgress = {
    load: vi.fn(async () => null),
    open: vi.fn(async () => null),
    recordFencingToken: vi.fn(async () => null),
    advance: vi.fn(async () => null),
    finalizeCompleted: vi.fn(async () => null),
  };
  let service: RecoveryCompletionService;

  function stubHappyPath() {
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: {
        sessionId: 'session-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        status: TradingSessionStatus.RUNNING,
        createdAt: earlier,
      },
      eligibleSessionIds: ['session-1'],
      recoveringOpen: null,
    });
    lease.getLastResult.mockReturnValue({
      outcome: 'LEASE_ACQUIRED',
      reason: 'missing_lease',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      ownerId: 'runtime-a',
      fencingToken: 4,
      expiresAt: '2026-07-30T20:05:00.000Z',
    });
    checkpoint.getLastResult.mockReturnValue({
      outcome: 'VALID_CHECKPOINT',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
    });
    reconcile.getLastResult.mockReturnValue({
      outcome: 'RECONCILED',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
    });
    resume.getLastResult.mockReturnValue({
      outcome: 'READY',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
    });
    admission.getLastResult.mockReturnValue({
      outcome: 'EVENT_ADMISSION_ENABLED',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
    });
    arming.getLastResult.mockReturnValue({
      outcome: 'ARMED',
      reason: 'runtime_armed',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      armedState: null,
    });
    evaluation.getLastResult.mockReturnValue({
      outcome: 'EVALUATED',
      reason: 'strategy_evaluated',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      decision: {
        kind: EvaluationOutcomeKind.SIGNAL_INTENT,
        direction: SignalIntentDirection.BUY,
        confidence: 0.8,
        reason: 'deployment action=buy',
      },
      restoredContext: null,
      eventId: 'evt-11',
      signalIntentEmitted: false,
      orderCreated: false,
    });
    signalIntent.getLastResult.mockReturnValue({
      outcome: 'SIGNAL_INTENT_GENERATED',
      reason: 'signal_intent_generated',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      eventId: 'evt-11',
      decision: null,
      plan: null,
      restoredContext: null,
      signalIntentGenerated: true,
      orderCreated: false,
    });
    findById.mockResolvedValue(recoveringSession());
    getLifecycle.mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.ARMED,
      fencingToken: 4,
      acceptsTicks: true,
      draining: false,
    });
    saveIfVersion.mockImplementation(async (session) => session);
  }

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

    service = new RecoveryCompletionService(
      sessions,
      runtime as never,
      transactions as never,
      outbox as never,
      discovery as never,
      lease as never,
      checkpoint as never,
      reconcile as never,
      resume as never,
      admission as never,
      arming as never,
      evaluation as never,
      signalIntent as never,
      recoveryProgress as never,
      {
        failClosedOnAmbiguity: vi.fn(async () => ({
          outcome: 'FAILED_CLOSED' as const,
          reason: 'test',
          incident: null,
          sessionId: 'session-1',
          workspaceId: 'ws-1',
          sessionStatus: null,
          recoveryPhase: null,
          evaluationAdmitted: false as const,
          signalIntentEmitted: false as const,
        })),
      } as never,
      logger as never,
    );
    stubHappyPath();
  });

  it('completes successfully, releases lease, and emits completion event', async () => {
    const result = await service.complete({
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETED');
    expect(result.leaseReleased).toBe(true);
    expect(result.completionEventEmitted).toBe(true);
    expect(result.toStatus).toBe(TradingSessionStatus.RUNNING);
    expect(result.nextSession?.lease).toBeNull();
    expect(saveIfVersion).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: 'TradingSessionRecoveryCompleted' }),
      at,
    );
    expect(runtime.stop).not.toHaveBeenCalled();
    expect(runtime.pause).not.toHaveBeenCalled();
    expect(runtime.evaluate).not.toHaveBeenCalled();
    expect(runtime.emitSignalIntent).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_completion',
      expect.objectContaining({
        outcome: 'RECOVERY_COMPLETED',
        leaseReleased: true,
        orderCreated: false,
        runtimeRemainsOperational: true,
      }),
    );
  });

  it('blocks duplicate completion', async () => {
    const first = await service.complete({ recordedAt: at, actorId: 'actor-1' });
    expect(first.outcome).toBe('RECOVERY_COMPLETED');

    findById.mockResolvedValue(recoveringSession());
    const second = await service.complete({ recordedAt: at, actorId: 'actor-1' });
    expect(second.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(second.reason).toBe('already_completed');
    expect(saveIfVersion).toHaveBeenCalledOnce();
  });

  it('blocks invalid lifecycle', async () => {
    let session = recoveringSession();
    session = transitionSession(session, TradingSessionStatus.RUNNING, at);
    findById.mockResolvedValue(session);

    const result = await service.complete({ recordedAt: at, actorId: 'actor-1' });
    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('invalid_lifecycle');
    expect(saveIfVersion).not.toHaveBeenCalled();
  });

  it('blocks lease mismatch', async () => {
    lease.getLastResult.mockReturnValue({
      outcome: 'LEASE_ACQUIRED',
      reason: 'missing_lease',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      ownerId: 'other-owner',
      fencingToken: 99,
      expiresAt: '2026-07-30T20:05:00.000Z',
    });

    const result = await service.complete({ recordedAt: at, actorId: 'actor-1' });
    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('lease_mismatch');
    expect(saveIfVersion).not.toHaveBeenCalled();
  });

  it('blocks unfinished Recovery stage', async () => {
    arming.getLastResult.mockReturnValue({
      outcome: 'ARMING_BLOCKED',
      reason: 'invalid_lifecycle',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      armedState: null,
    });

    const result = await service.complete({
      recordedAt: at,
      actorId: 'actor-1',
      controlledTermination: true,
    });
    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('unfinished_recovery_stage');
    expect(result.unfinishedStage).toBe('arming');
    expect(saveIfVersion).not.toHaveBeenCalled();
  });
});
