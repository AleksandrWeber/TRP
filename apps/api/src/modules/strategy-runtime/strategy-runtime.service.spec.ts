import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  StrategyDeploymentStatus,
  approveStrategyDeployment,
  createStrategyDeployment,
  type StrategyDeploymentService,
} from '../strategy-deployment';
import { createStrategyCheckpoint } from './domain/strategy-checkpoint';
import { RuntimeWorkerState } from './domain/runtime-lifecycle';
import { RuntimeLifecycleCoordinator } from './runtime-lifecycle.coordinator';
import type { RuntimeEvaluationService } from './runtime-evaluation.service';
import type { SignalIntentService } from './signal-intent.service';
import type { StrategyCheckpointService } from './strategy-checkpoint.service';
import { StrategyRuntimeService } from './strategy-runtime.service';

const at = '2026-07-29T18:00:00.000Z';

function approvedDeployment() {
  const draft = createStrategyDeployment({
    id: 'deployment-1',
    workspaceId: 'workspace-1',
    strategyId: 'strategy-1',
    strategyVersion: '1.0.0',
    parameters: { period: 20 },
    instrument: 'BTCUSDT',
    timeframe: '1h',
    marketDataSourceId: 'binance-spot',
    paperExecutionConfigurationId: 'paper-config',
    riskPolicyId: 'risk-1',
    riskPolicyVersion: 1,
    createdAt: at,
    recordedAt: at,
    actorId: 'trader-1',
    idempotencyKey: 'idem-1',
  });
  return approveStrategyDeployment(draft, {
    approvedAt: at,
    approvedByActorId: 'admin-1',
    recordedAt: at,
  });
}

describe('US216/US219/US220 — StrategyRuntimeService', () => {
  const deployments = {
    get: vi.fn(),
  };
  const signalIntents = {
    emit: vi.fn(),
    listBySession: vi.fn(),
  };
  const checkpoints = {
    load: vi.fn(),
    save: vi.fn(),
  };
  const evaluations = {
    evaluate: vi.fn(),
  };

  let lifecycle: RuntimeLifecycleCoordinator;
  let service: StrategyRuntimeService;

  beforeEach(() => {
    vi.clearAllMocks();
    lifecycle = new RuntimeLifecycleCoordinator();
    service = new StrategyRuntimeService(
      deployments as unknown as StrategyDeploymentService,
      signalIntents as unknown as SignalIntentService,
      checkpoints as unknown as StrategyCheckpointService,
      evaluations as unknown as RuntimeEvaluationService,
      lifecycle,
    );
  });

  it('loads RuntimeContext from approved deployment and checkpoint', async () => {
    const deployment = approvedDeployment();
    const checkpoint = createStrategyCheckpoint({
      workspaceId: 'workspace-1',
      deploymentId: deployment.id,
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 2,
        openTime: '2026-07-29T17:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-2',
      updatedAt: at,
    });
    deployments.get.mockResolvedValue(deployment);
    checkpoints.load.mockResolvedValue(checkpoint);

    const context = await service.loadContext({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
    });

    expect(context.deployment.status).toBe(StrategyDeploymentStatus.APPROVED);
    expect(context.checkpoint?.lastProcessedEventId).toBe('evt-2');
  });

  it('returns diagnostics with worker lifecycle fields', async () => {
    checkpoints.load.mockResolvedValue(null);
    await service.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: at,
    });
    const diagnostics = await service.getDiagnostics('workspace-1', 'session-1');
    expect(diagnostics.evaluationEnabled).toBe(true);
    expect(diagnostics.workerState).toBe(RuntimeWorkerState.ARMED);
    expect(diagnostics.acceptsTicks).toBe(true);
  });

  it('rejects admit/evaluate while IDLE and accepts after arm', async () => {
    checkpoints.load.mockResolvedValue(null);
    evaluations.evaluate.mockResolvedValue({
      status: 'COMPLETED',
      outcomeKind: 'NO_ACTION',
      checkpointAdvanced: true,
      eventId: 'evt-1',
    });

    const denied = await service.admitTick({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      event: {
        eventType: 'MarketClosedCandle',
        eventId: 'evt-1',
        workspaceId: 'workspace-1',
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T17:00:00.000Z',
        closeTime: '2026-07-29T17:59:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lease: {
        sessionId: 'session-1',
        fencingToken: 1,
        ownerId: 'worker-1',
        expiresAt: '2026-07-29T19:00:00.000Z',
        sessionStatus: 'RUNNING',
      },
      nowIso: at,
    });
    expect(denied.status).toBe('REJECTED_RUNTIME_NOT_ARMED');

    await service.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: at,
    });

    const admitted = await service.admitTick({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      event: {
        eventType: 'MarketClosedCandle',
        eventId: 'evt-1',
        workspaceId: 'workspace-1',
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T17:00:00.000Z',
        closeTime: '2026-07-29T17:59:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lease: {
        sessionId: 'session-1',
        fencingToken: 1,
        ownerId: 'worker-1',
        expiresAt: '2026-07-29T19:00:00.000Z',
        sessionStatus: 'RUNNING',
      },
      nowIso: at,
    });
    expect(admitted.admitted).toBe(true);

    const evaluated = await service.evaluate({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      event: {
        eventType: 'MarketClosedCandle',
        eventId: 'evt-1',
        workspaceId: 'workspace-1',
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T17:00:00.000Z',
        closeTime: '2026-07-29T17:59:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
        open: 1,
        high: 2,
        low: 1,
        close: 2,
        volume: 1,
      },
      lease: {
        sessionId: 'session-1',
        fencingToken: 1,
        ownerId: 'worker-1',
        expiresAt: '2026-07-29T19:00:00.000Z',
        sessionStatus: 'RUNNING',
      },
      nowIso: at,
      recordedAt: at,
      actorId: 'runtime-1',
    });
    expect(evaluated.status).toBe('COMPLETED');
    expect(evaluations.evaluate).toHaveBeenCalledOnce();
  });

  it('drains in-flight evaluate on pause and preserves replay rejection afterward', async () => {
    checkpoints.load.mockResolvedValue(null);
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    evaluations.evaluate.mockImplementation(async () => {
      await blocked;
      return {
        status: 'COMPLETED',
        outcomeKind: 'NO_ACTION',
        intent: null,
        intentCreated: false,
        checkpointAdvanced: true,
        checkpoint: { lastProcessedEventId: 'evt-1', version: 1 },
        eventId: 'evt-1',
        reason: 'ok',
        decision: null,
        admissionStatus: null,
      };
    });

    await service.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: at,
    });

    const evaluating = service.evaluate({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      event: {
        eventType: 'MarketClosedCandle',
        eventId: 'evt-1',
        workspaceId: 'workspace-1',
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T17:00:00.000Z',
        closeTime: '2026-07-29T17:59:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
        open: 1,
        high: 2,
        low: 1,
        close: 2,
        volume: 1,
      },
      lease: {
        sessionId: 'session-1',
        fencingToken: 1,
        ownerId: 'worker-1',
        expiresAt: '2026-07-29T19:00:00.000Z',
        sessionStatus: 'RUNNING',
      },
      nowIso: at,
      recordedAt: at,
      actorId: 'runtime-1',
    });

    const pausing = service.pause({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: at,
    });

    await Promise.resolve();
    expect((await service.getLifecycle('workspace-1', 'session-1')).state).toBe(
      RuntimeWorkerState.DRAINING,
    );

    release();
    const [evalResult, pauseResult] = await Promise.all([evaluating, pausing]);
    expect(evalResult.status).toBe('COMPLETED');
    expect(pauseResult.toState).toBe(RuntimeWorkerState.IDLE);
    expect(pauseResult.drained).toBe(true);

    const rejected = await service.evaluate({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      event: {
        eventType: 'MarketClosedCandle',
        eventId: 'evt-2',
        workspaceId: 'workspace-1',
        streamId: 'binance:btcusdt:1h',
        sequence: 2,
        openTime: '2026-07-29T18:00:00.000Z',
        closeTime: '2026-07-29T18:59:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
        open: 1,
        high: 2,
        low: 1,
        close: 2,
        volume: 1,
      },
      lease: {
        sessionId: 'session-1',
        fencingToken: 1,
        ownerId: 'worker-1',
        expiresAt: '2026-07-29T19:00:00.000Z',
        sessionStatus: 'RUNNING',
      },
      nowIso: at,
      recordedAt: at,
      actorId: 'runtime-1',
    });
    expect(rejected.status).toBe('REJECTED_LIFECYCLE');
  });

  it('delegates Signal Intent and Checkpoint ports', async () => {
    signalIntents.emit.mockResolvedValue({ created: true, intent: { id: 'si_1' } });
    signalIntents.listBySession.mockResolvedValue([]);
    checkpoints.save.mockResolvedValue({ advanced: true, checkpoint: { version: 1 } });
    checkpoints.load.mockResolvedValue(null);

    await service.emitSignalIntent({} as never);
    await service.listSignalIntents('workspace-1', 'session-1');
    await service.saveCheckpoint({} as never);
    await service.loadCheckpoint('workspace-1', 'session-1');

    expect(signalIntents.emit).toHaveBeenCalledOnce();
    expect(signalIntents.listBySession).toHaveBeenCalledOnce();
    expect(checkpoints.save).toHaveBeenCalledOnce();
  });
});
