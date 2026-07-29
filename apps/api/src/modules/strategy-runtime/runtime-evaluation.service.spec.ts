import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveStrategyDeployment,
  createStrategyDeployment,
  type StrategyDeploymentService,
} from '../strategy-deployment';
import { EvaluationOutcomeKind } from './domain/runtime-evaluation';
import { EvaluationStatus } from './domain/evaluation-result';
import { SignalIntentDirection, createSignalIntent } from './domain/signal-intent';
import { createStrategyCheckpoint } from './domain/strategy-checkpoint';
import type { SignalIntentRepository } from './persistence/signal-intent.repository';
import type { StrategyCheckpointRepository } from './persistence/strategy-checkpoint.repository';
import { RuntimeEvaluationService } from './runtime-evaluation.service';

const at = '2026-07-29T18:00:00.000Z';
const recordedAt = '2026-07-29T18:00:01.000Z';
const expiresAt = '2026-07-29T19:00:00.000Z';

function approvedDeployment(
  parameters: Record<string, unknown> = { action: 'buy', confidence: 0.7 },
) {
  const draft = createStrategyDeployment({
    id: 'deployment-1',
    workspaceId: 'workspace-1',
    strategyId: 'strategy-1',
    strategyVersion: '1.0.0',
    parameters,
    instrument: 'BTCUSDT',
    timeframe: '1h',
    marketDataSourceId: 'binance-spot',
    paperExecutionConfigurationId: 'paper-config',
    riskPolicyId: 'risk-1',
    riskPolicyVersion: 1,
    createdAt: at,
    recordedAt: at,
    actorId: 'trader-1',
    idempotencyKey: `idem-${JSON.stringify(parameters)}`,
  });
  return approveStrategyDeployment(draft, {
    approvedAt: at,
    approvedByActorId: 'admin-1',
    recordedAt: at,
  });
}

function evaluateCommand(overrides: Record<string, unknown> = {}) {
  return {
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
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 10,
    },
    lease: {
      sessionId: 'session-1',
      fencingToken: 1,
      ownerId: 'worker-1',
      expiresAt,
      sessionStatus: 'RUNNING',
    },
    nowIso: at,
    recordedAt,
    actorId: 'runtime-1',
    ...overrides,
  };
}

describe('US219 — RuntimeEvaluationService', () => {
  const deployments = { get: vi.fn() };
  const intents: SignalIntentRepository = {
    append: vi.fn(),
    findById: vi.fn(),
    findByIntentHash: vi.fn(),
    listBySession: vi.fn(),
  };
  const checkpoints: StrategyCheckpointRepository = {
    save: vi.fn(),
    findBySession: vi.fn(),
    findById: vi.fn(),
  };
  const outboxAppends: unknown[] = [];
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({ tx: true })),
  };
  const outbox = {
    append: vi.fn(async (_tx: unknown, envelope: unknown) => {
      outboxAppends.push(envelope);
      return undefined;
    }),
  };

  let service: RuntimeEvaluationService;

  beforeEach(() => {
    vi.clearAllMocks();
    outboxAppends.length = 0;
    service = new RuntimeEvaluationService(
      deployments as unknown as StrategyDeploymentService,
      intents,
      checkpoints,
      transactions as never,
      outbox as never,
    );
    vi.mocked(checkpoints.findBySession).mockResolvedValue(null);
    vi.mocked(checkpoints.save).mockImplementation(async (checkpoint) => checkpoint);
    vi.mocked(intents.findByIntentHash).mockResolvedValue(null);
    vi.mocked(intents.append).mockImplementation(async (intent) => intent);
  });

  it('emits Signal Intent and advances checkpoint atomically for actionable ticks', async () => {
    deployments.get.mockResolvedValue(approvedDeployment({ action: 'buy', confidence: 0.7 }));

    const result = await service.evaluate(evaluateCommand());

    expect(result.status).toBe(EvaluationStatus.COMPLETED);
    expect(result.outcomeKind).toBe(EvaluationOutcomeKind.SIGNAL_INTENT);
    expect(result.intentCreated).toBe(true);
    expect(result.intent?.direction).toBe(SignalIntentDirection.BUY);
    expect(result.checkpointAdvanced).toBe(true);
    expect(result.checkpoint?.lastProcessedEventId).toBe('evt-1');
    expect(intents.append).toHaveBeenCalledOnce();
    expect(checkpoints.save).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledTimes(2);
    expect(outboxAppends.map((e) => (e as { eventType: string }).eventType)).toEqual([
      'SignalIntentCreated',
      'StrategyCheckpointAdvanced',
    ]);
  });

  it('supports NO_ACTION with checkpoint Outbox only', async () => {
    deployments.get.mockResolvedValue(approvedDeployment({ action: 'hold' }));

    const result = await service.evaluate(evaluateCommand());

    expect(result.status).toBe(EvaluationStatus.COMPLETED);
    expect(result.outcomeKind).toBe(EvaluationOutcomeKind.NO_ACTION);
    expect(result.intent).toBeNull();
    expect(result.intentCreated).toBe(false);
    expect(result.checkpointAdvanced).toBe(true);
    expect(intents.append).not.toHaveBeenCalled();
    expect(outboxAppends.map((e) => (e as { eventType: string }).eventType)).toEqual([
      'StrategyCheckpointAdvanced',
    ]);
  });

  it('rejects non-admitted ticks without side effects', async () => {
    deployments.get.mockResolvedValue(approvedDeployment({ action: 'buy' }));
    vi.mocked(checkpoints.findBySession).mockResolvedValue(
      createStrategyCheckpoint({
        workspaceId: 'workspace-1',
        deploymentId: 'deployment-1',
        sessionId: 'session-1',
        lastProcessedCandle: {
          streamId: 'binance:btcusdt:1h',
          sequence: 5,
          openTime: '2026-07-29T16:00:00.000Z',
          instrument: 'BTCUSDT',
          timeframe: '1h',
        },
        lastProcessedEventId: 'evt-5',
        updatedAt: at,
      }),
    );

    const result = await service.evaluate(
      evaluateCommand({
        event: {
          eventType: 'MarketClosedCandle',
          eventId: 'evt-1',
          workspaceId: 'workspace-1',
          streamId: 'binance:btcusdt:1h',
          sequence: 1,
          openTime: '2026-07-29T12:00:00.000Z',
          closeTime: '2026-07-29T12:59:59.999Z',
          instrument: 'BTCUSDT',
          timeframe: '1h',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 10,
        },
      }),
    );

    expect(result.status).toBe(EvaluationStatus.REJECTED_NOT_ADMITTED);
    expect(result.admissionStatus).toBe('REJECTED_STALE');
    expect(intents.append).not.toHaveBeenCalled();
    expect(checkpoints.save).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('prevents duplicate execution when checkpoint already advanced', async () => {
    deployments.get.mockResolvedValue(approvedDeployment({ action: 'buy' }));
    const checkpoint = createStrategyCheckpoint({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T17:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-1',
      updatedAt: at,
    });
    vi.mocked(checkpoints.findBySession).mockResolvedValue(checkpoint);

    const result = await service.evaluate(evaluateCommand());

    expect(result.status).toBe(EvaluationStatus.ALREADY_PROCESSED);
    expect(result.checkpointAdvanced).toBe(false);
    expect(intents.append).not.toHaveBeenCalled();
    expect(checkpoints.save).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('replays identically for the same admitted candle and deployment', async () => {
    deployments.get.mockResolvedValue(
      approvedDeployment({ compareCloseToOpen: true, confidence: 0.55 }),
    );

    const first = await service.evaluate(evaluateCommand());
    expect(first.status).toBe(EvaluationStatus.COMPLETED);
    expect(first.intent?.direction).toBe(SignalIntentDirection.BUY);

    // Simulate durable state after first commit
    vi.mocked(checkpoints.findBySession).mockResolvedValue(first.checkpoint);
    vi.mocked(intents.findByIntentHash).mockResolvedValue(first.intent);

    const second = await service.evaluate(evaluateCommand());
    expect(second.status).toBe(EvaluationStatus.ALREADY_PROCESSED);
    expect(second.eventId).toBe(first.eventId);

    // Fresh session replay with same inputs yields same Intent identity
    vi.mocked(checkpoints.findBySession).mockResolvedValue(null);
    vi.mocked(intents.findByIntentHash).mockResolvedValue(null);
    const rebuilt = await service.evaluate(evaluateCommand());
    expect(rebuilt.intent?.intentHash).toBe(first.intent?.intentHash);
    expect(rebuilt.intent?.id).toBe(first.intent?.id);
  });

  it('does not create Orders or Risk artifacts in metadata', async () => {
    deployments.get.mockResolvedValue(approvedDeployment({ action: 'sell' }));
    const result = await service.evaluate(evaluateCommand());
    expect(result.intent).not.toHaveProperty('orderId');
    expect(result.intent?.metadata).not.toHaveProperty('riskDecisionId');
    expect(result.checkpoint).not.toHaveProperty('fencingToken');
  });

  it('reuses existing Signal Intent identity inside the atomic commit', async () => {
    deployments.get.mockResolvedValue(approvedDeployment({ action: 'buy', confidence: 0.7 }));
    const existing = createSignalIntent({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1h',
      direction: SignalIntentDirection.BUY,
      confidence: 0.7,
      marketCheckpoint: {
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        eventId: 'evt-1',
      },
      generatedAt: '2026-07-29T17:59:59.999Z',
      recordedAt,
      actorId: 'runtime-1',
      metadata: {
        evaluationReason: 'deployment action=buy',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 10,
      },
    });
    vi.mocked(intents.findByIntentHash).mockResolvedValue(existing);

    const result = await service.evaluate(evaluateCommand());

    expect(result.intentCreated).toBe(false);
    expect(result.intent?.id).toBe(existing.id);
    expect(intents.append).not.toHaveBeenCalled();
    expect(result.checkpointAdvanced).toBe(true);
    expect(outboxAppends.map((e) => (e as { eventType: string }).eventType)).toEqual([
      'StrategyCheckpointAdvanced',
    ]);
  });
});
