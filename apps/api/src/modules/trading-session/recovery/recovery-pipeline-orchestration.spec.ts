import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeWorkerState } from '../../strategy-runtime/domain/runtime-lifecycle';
import type { StrategyRuntimePort } from '../../strategy-runtime/ports/strategy-runtime.port';
import { deterministicCheckpointId } from '../../strategy-runtime/domain/strategy-checkpoint';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';
import { RecoveryLeaseAcquisitionService } from './recovery-lease-acquisition.service';
import { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';
import { RecoveryStateReconciliationService } from './recovery-state-reconciliation.service';
import { RecoveryRuntimeResumeService } from './recovery-runtime-resume.service';
import { RecoveryEventAdmissionService } from './recovery-event-admission.service';
import { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';
import { RecoveryStrategyEvaluationService } from './recovery-strategy-evaluation.service';
import { RecoverySignalIntentGenerationService } from './recovery-signal-intent-generation.service';
import { RecoveryCompletionService } from './recovery-completion.service';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import type { RecoveryEventAdmissionPolicy } from '../ports/recovery-event-admission-policy.port';
import type { RecoveryReconciliationPorts } from '../ports/recovery-reconciliation.ports';
import { EvaluationOutcomeKind, TickAdmissionStatus } from '../../strategy-runtime';
import { approveStrategyDeployment, createStrategyDeployment } from '../../strategy-deployment';
import { TradingSessionStatus } from '../domain/trading-session-status';

const at = '2026-07-30T17:00:00.000Z';

function sessionRow() {
  return Object.freeze({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    status: 'running',
    lease: null,
    lastFencingToken: 0,
    version: 2,
    failureReason: null,
    createdAt: at,
    recordedAt: at,
    actorId: 'actor-1',
    correlationId: null,
    idempotencyKey: 'idem-1',
  });
}

describe('US244A — recovery pipeline deterministic orchestration', () => {
  const findByStatuses = vi.fn();
  const findById = vi.fn();
  const saveIfVersion = vi.fn();
  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    saveIfVersion,
    findById,
    findByIdempotencyKey: vi.fn(),
    findByStatuses,
  };

  const runtime = {
    loadCheckpoint: vi.fn(),
    listSignalIntents: vi.fn(),
    loadContext: vi.fn(),
    getLifecycle: vi.fn(),
    getDiagnostics: vi.fn(),
    arm: vi.fn(),
    enableEventAdmission: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    admitTick: vi.fn(),
    evaluate: vi.fn(),
    emitSignalIntent: vi.fn(),
    saveCheckpoint: vi.fn(),
  } as unknown as StrategyRuntimePort;

  const ports = {
    listOrdersBySession: vi.fn(),
    reconcileExecution: vi.fn(),
    readAccounting: vi.fn(),
    readRisk: vi.fn(),
  } as unknown as RecoveryReconciliationPorts;

  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = {
    append: vi.fn(async () => undefined),
  };

  const admissionPolicy = {
    isKillSwitchActive: vi.fn(async () => false),
  } as RecoveryEventAdmissionPolicy;

  let logger: {
    info: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    child: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    logger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    logger.child.mockReturnValue(logger);

    findByStatuses.mockResolvedValue([sessionRow()]);
    // Track persisted Session across US290 force + US241 lease CAS writes.
    let persisted: ReturnType<typeof sessionRow> | (ReturnType<typeof sessionRow> & object) =
      sessionRow();
    findById.mockImplementation(async () => persisted);
    saveIfVersion.mockImplementation(async (session) => {
      persisted = Object.freeze({ ...session }) as typeof persisted;
      return persisted;
    });

    (runtime.loadCheckpoint as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: deterministicCheckpointId('ws-1', 'session-1'),
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'stream-1',
        sequence: 10,
        openTime: at,
        instrument: 'BTCUSDT',
        timeframe: '1m',
      },
      lastProcessedEventId: 'evt-10',
      runtimeVersion: '1',
      version: 3,
      updatedAt: at,
    });
    (runtime.listSignalIntents as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (runtime.loadContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      deployment: {
        id: 'deployment-1',
        workspaceId: 'ws-1',
        status: 'APPROVED',
      },
      checkpoint: {
        id: deterministicCheckpointId('ws-1', 'session-1'),
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        sessionId: 'session-1',
        lastProcessedCandle: {
          streamId: 'stream-1',
          sequence: 10,
          openTime: at,
          instrument: 'BTCUSDT',
          timeframe: '1m',
        },
        lastProcessedEventId: 'evt-10',
        runtimeVersion: '1',
        version: 3,
        updatedAt: at,
      },
      runtimeVersion: '1',
    });
    (runtime.getLifecycle as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.IDLE,
      fencingToken: null,
      acceptsTicks: false,
      draining: false,
    });
    (runtime.getDiagnostics as ReturnType<typeof vi.fn>).mockResolvedValue({
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

    (ports.listOrdersBySession as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (ports.readAccounting as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'consistent',
      sourceHash: 'h',
      rebuiltHash: 'h',
      reason: null,
    });
    (ports.readRisk as ReturnType<typeof vi.fn>).mockResolvedValue({
      killSwitchActive: null,
      decisions: [],
    });
  });

  function buildPipeline() {
    const recoveryProgress = {
      load: vi.fn(async () => null),
      open: vi.fn(async () => null),
      recordFencingToken: vi.fn(async () => null),
      advance: vi.fn(async () => null),
      finalizeCompleted: vi.fn(async () => null),
      correlateIncident: vi.fn(async () => null),
    };
    const failClosed = {
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
    };
    const discovery = new StartupRecoveryDiscoveryService(
      sessions,
      transactions as never,
      outbox as never,
      recoveryProgress as never,
      logger as never,
    );
    const lease = new RecoveryLeaseAcquisitionService(
      sessions,
      transactions as never,
      discovery,
      recoveryProgress as never,
      failClosed as never,
      logger as never,
    );
    const checkpoint = new RecoveryCheckpointValidationService(
      runtime,
      lease,
      discovery,
      recoveryProgress as never,
      failClosed as never,
      logger as never,
    );
    const reconciliation = new RecoveryStateReconciliationService(
      sessions,
      runtime,
      ports,
      discovery,
      lease,
      checkpoint,
      failClosed as never,
      logger as never,
    );
    const resume = new RecoveryRuntimeResumeService(
      runtime,
      lease,
      discovery,
      checkpoint,
      reconciliation,
      recoveryProgress as never,
      failClosed as never,
      logger as never,
    );
    const admission = new RecoveryEventAdmissionService(
      runtime,
      sessions,
      resume,
      admissionPolicy,
      logger as never,
    );
    const arming = new RecoveryRuntimeArmingService(
      runtime,
      sessions,
      admission,
      admissionPolicy,
      logger as never,
    );
    const evaluation = new RecoveryStrategyEvaluationService(
      runtime,
      sessions,
      arming,
      logger as never,
    );
    const signalIntent = new RecoverySignalIntentGenerationService(
      runtime,
      arming,
      evaluation,
      logger as never,
    );
    const completion = new RecoveryCompletionService(
      sessions,
      runtime,
      transactions as never,
      outbox as never,
      discovery,
      lease,
      checkpoint,
      reconciliation,
      resume,
      admission,
      arming,
      evaluation,
      signalIntent,
      recoveryProgress as never,
      failClosed as never,
      logger as never,
    );
    return {
      discovery,
      lease,
      checkpoint,
      reconciliation,
      resume,
      admission,
      arming,
      evaluation,
      signalIntent,
      completion,
    };
  }

  it('executes US240→US244 correctly even when bootstrap is invoked from the final stage first', async () => {
    const pipeline = buildPipeline();

    await pipeline.resume.onApplicationBootstrap();

    expect(pipeline.discovery.getLastResult()?.outcome).toBe('recovery_candidate');
    expect(pipeline.lease.getLastResult()?.outcome).toBe('LEASE_ACQUIRED');
    expect(pipeline.checkpoint.getLastResult()?.outcome).toBe('VALID_CHECKPOINT');
    expect(pipeline.reconciliation.getLastResult()?.outcome).toBe('RECONCILED');
    expect(pipeline.resume.getLastResult()?.outcome).toBe('READY');
    expect(runtime.arm).not.toHaveBeenCalled();
    expect(runtime.resume).not.toHaveBeenCalled();
    expect(runtime.evaluate).not.toHaveBeenCalled();
  });

  it('executes US245 event admission only after READY and without evaluation', async () => {
    const pipeline = buildPipeline();
    await pipeline.resume.onApplicationBootstrap();
    const nowIso = new Date().toISOString();

    (runtime.enableEventAdmission as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.IDLE,
      toState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      drained: false,
      reason: 'recovery event admission enabled',
    });
    (runtime.getLifecycle as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.IDLE,
        fencingToken: 1,
        acceptsTicks: false,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      });
    (runtime.getDiagnostics as ReturnType<typeof vi.fn>)
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

    const result = await pipeline.admission.enable(nowIso);

    expect(result.outcome).toBe('EVENT_ADMISSION_ENABLED');
    expect(result.reason).toBe('event_admission_enabled');
    expect(runtime.enableEventAdmission).toHaveBeenCalledOnce();
    expect(runtime.admitTick).not.toHaveBeenCalled();
    expect(runtime.evaluate).not.toHaveBeenCalled();
    expect(runtime.emitSignalIntent).not.toHaveBeenCalled();
  });

  it('executes US246 arming only after EVENT_ADMISSION_ENABLED and without evaluation', async () => {
    const pipeline = buildPipeline();
    await pipeline.resume.onApplicationBootstrap();
    const nowIso = new Date().toISOString();

    (runtime.enableEventAdmission as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.IDLE,
      toState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      drained: false,
      reason: 'recovery event admission enabled',
    });
    (runtime.arm as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      toState: RuntimeWorkerState.ARMED,
      drained: false,
      reason: 'recovery runtime armed',
    });
    (runtime.getLifecycle as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.IDLE,
        fencingToken: 1,
        acceptsTicks: false,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.ARMED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      });
    (runtime.getDiagnostics as ReturnType<typeof vi.fn>)
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

    const admitted = await pipeline.admission.enable(nowIso);
    const armed = await pipeline.arming.arm(nowIso);

    expect(admitted.outcome).toBe('EVENT_ADMISSION_ENABLED');
    expect(armed.outcome).toBe('ARMED');
    expect(armed.reason).toBe('runtime_armed');
    expect(runtime.arm).toHaveBeenCalledOnce();
    expect(runtime.evaluate).not.toHaveBeenCalled();
    expect(runtime.emitSignalIntent).not.toHaveBeenCalled();
    expect(runtime.saveCheckpoint).not.toHaveBeenCalled();
  });

  it('executes US247→US249 SignalIntent then recovery completion without Orders', async () => {
    const pipeline = buildPipeline();
    await pipeline.resume.onApplicationBootstrap();
    const nowIso = new Date().toISOString();

    (runtime.enableEventAdmission as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.IDLE,
      toState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      drained: false,
      reason: 'recovery event admission enabled',
    });
    (runtime.arm as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      fromState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
      toState: RuntimeWorkerState.ARMED,
      drained: false,
      reason: 'recovery runtime armed',
    });
    (runtime.getLifecycle as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.IDLE,
        fencingToken: 1,
        acceptsTicks: false,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      })
      .mockResolvedValueOnce({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.ARMED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      })
      .mockResolvedValue({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: RuntimeWorkerState.ARMED,
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      });
    (runtime.getDiagnostics as ReturnType<typeof vi.fn>)
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
      })
      .mockResolvedValue({
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

    const approved = approveStrategyDeployment(
      createStrategyDeployment({
        id: 'deployment-1',
        workspaceId: 'ws-1',
        strategyId: 'strategy-1',
        strategyVersion: '1.0.0',
        parameters: { action: 'buy' },
        instrument: 'BTCUSDT',
        timeframe: '1m',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config',
        riskPolicyId: 'risk-1',
        riskPolicyVersion: 1,
        createdAt: at,
        recordedAt: at,
        actorId: 'actor-1',
        idempotencyKey: 'idem-pipeline-eval',
      }),
      { approvedAt: at, approvedByActorId: 'admin-1', recordedAt: at },
    );
    (runtime.loadContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      deployment: approved,
      checkpoint: {
        id: deterministicCheckpointId('ws-1', 'session-1'),
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        sessionId: 'session-1',
        lastProcessedCandle: {
          streamId: 'stream-1',
          sequence: 10,
          openTime: at,
          instrument: 'BTCUSDT',
          timeframe: '1m',
        },
        lastProcessedEventId: 'evt-10',
        runtimeVersion: '1',
        version: 3,
        updatedAt: at,
      },
      runtimeVersion: '1',
    });
    (runtime.admitTick as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: TickAdmissionStatus.ADMITTED,
      admitted: true,
      reason: 'closed-candle tick admitted',
      eventId: 'evt-11',
      streamId: 'stream-1',
      sequence: 11,
    });

    await pipeline.admission.enable(nowIso);
    await pipeline.arming.arm(nowIso);
    const evaluated = await pipeline.evaluation.evaluate({
      nowIso,
      event: {
        eventId: 'evt-11',
        workspaceId: 'ws-1',
        streamId: 'stream-1',
        sequence: 11,
        openTime: '2026-07-30T17:01:00.000Z',
        closeTime: '2026-07-30T17:01:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1m',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1,
      },
    });

    expect(evaluated.outcome).toBe('EVALUATED');
    expect(evaluated.decision?.kind).toBe(EvaluationOutcomeKind.SIGNAL_INTENT);
    expect(evaluated.signalIntentEmitted).toBe(false);
    expect(evaluated.orderCreated).toBe(false);
    expect(runtime.admitTick).toHaveBeenCalledOnce();
    expect(runtime.evaluate).not.toHaveBeenCalled();
    expect(runtime.emitSignalIntent).not.toHaveBeenCalled();
    expect(runtime.saveCheckpoint).not.toHaveBeenCalled();

    (runtime.emitSignalIntent as ReturnType<typeof vi.fn>).mockResolvedValue({
      intent: {
        id: 'si_pipeline',
        intentHash: 'hash-pipeline',
        intentVersion: 1,
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        sessionId: 'session-1',
        strategyVersion: '1.0.0',
        instrument: 'BTCUSDT',
        timeframe: '1m',
        direction: 'buy',
        confidence: null,
        marketCheckpoint: { streamId: 'stream-1', sequence: 11, eventId: 'evt-11' },
        generatedAt: '2026-07-30T17:01:59.999Z',
        recordedAt: nowIso,
        actorId: 'actor-1',
        correlationId: null,
        metadata: {},
      },
      created: true,
    });

    const generated = await pipeline.signalIntent.generate({
      event: {
        eventId: 'evt-11',
        workspaceId: 'ws-1',
        streamId: 'stream-1',
        sequence: 11,
        openTime: '2026-07-30T17:01:00.000Z',
        closeTime: '2026-07-30T17:01:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1m',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1,
      },
      recordedAt: nowIso,
      actorId: 'actor-1',
    });

    expect(generated.outcome).toBe('SIGNAL_INTENT_GENERATED');
    expect(generated.signalIntentGenerated).toBe(true);
    expect(generated.intentCreated).toBe(true);
    expect(generated.orderCreated).toBe(false);
    expect(runtime.emitSignalIntent).toHaveBeenCalledOnce();
    expect(runtime.evaluate).not.toHaveBeenCalled();
    expect(runtime.saveCheckpoint).not.toHaveBeenCalled();

    const duplicate = await pipeline.signalIntent.generate({
      event: {
        eventId: 'evt-11',
        workspaceId: 'ws-1',
        streamId: 'stream-1',
        sequence: 11,
        openTime: '2026-07-30T17:01:00.000Z',
        closeTime: '2026-07-30T17:01:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1m',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1,
      },
      recordedAt: nowIso,
      actorId: 'actor-1',
    });
    expect(duplicate.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(duplicate.reason).toBe('decision_already_converted');
    expect(runtime.emitSignalIntent).toHaveBeenCalledOnce();

    // US290 discovery open already forced RECOVERING; completion uses production status.
    expect(pipeline.discovery.getLastResult()?.recoveringOpen?.action).toBe('forced');
    expect(pipeline.discovery.getLastResult()?.candidate?.status).toBe(
      TradingSessionStatus.RECOVERING,
    );
    const leased = saveIfVersion.mock.calls.find((call) => call[0].lease !== null)?.[0];
    expect(leased).toBeDefined();
    (runtime.getLifecycle as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.ARMED,
      fencingToken: leased.lease.fencingToken,
      acceptsTicks: true,
      draining: false,
    });

    const completed = await pipeline.completion.complete({
      recordedAt: nowIso,
      actorId: 'actor-1',
    });
    expect(completed.outcome).toBe('RECOVERY_COMPLETED');
    expect(completed.terminalCause).toBe('SIGNAL_INTENT_GENERATED');
    expect(completed.leaseReleased).toBe(true);
    expect(completed.toStatus).toBe(TradingSessionStatus.RUNNING);
    expect(completed.nextSession?.lease).toBeNull();
    expect(outbox.append).toHaveBeenCalled();
    expect(runtime.stop).not.toHaveBeenCalled();
    expect(runtime.evaluate).not.toHaveBeenCalled();

    const duplicateCompletion = await pipeline.completion.complete({
      recordedAt: nowIso,
      actorId: 'actor-1',
    });
    expect(duplicateCompletion.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(duplicateCompletion.reason).toBe('already_completed');
  });

  it('stops cleanly after upstream failure and never contacts downstream runtime stages', async () => {
    findByStatuses.mockResolvedValue([]);
    const pipeline = buildPipeline();

    await pipeline.resume.onApplicationBootstrap();

    expect(pipeline.discovery.getLastResult()?.outcome).toBe('no_recovery_required');
    expect(saveIfVersion).not.toHaveBeenCalled();
    expect(runtime.loadCheckpoint).not.toHaveBeenCalled();
    expect(runtime.loadContext).not.toHaveBeenCalled();
    expect(runtime.getDiagnostics).not.toHaveBeenCalled();
  });
});
