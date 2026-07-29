import { describe, expect, it } from 'vitest';
import {
  StrategyDeploymentStatus,
  createStrategyDeployment,
  approveStrategyDeployment,
} from '../../strategy-deployment';
import { createStrategyCheckpoint } from './strategy-checkpoint';
import { createRuntimeContext, createRuntimeDiagnostics } from './runtime-context';

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

describe('US216 — RuntimeContext', () => {
  it('builds a frozen context from approved deployment and optional checkpoint', () => {
    const deployment = approvedDeployment();
    const checkpoint = createStrategyCheckpoint({
      workspaceId: 'workspace-1',
      deploymentId: deployment.id,
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 3,
        openTime: '2026-07-29T17:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-3',
      updatedAt: at,
    });

    const context = createRuntimeContext({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deployment,
      checkpoint,
    });

    expect(context.deploymentId).toBe('deployment-1');
    expect(context.deployment.status).toBe(StrategyDeploymentStatus.APPROVED);
    expect(context.checkpoint?.version).toBe(1);
    expect(Object.isFrozen(context)).toBe(true);
    expect(context).not.toHaveProperty('lease');
    expect(context).not.toHaveProperty('fencingToken');
    expect(context).not.toHaveProperty('orderId');
  });

  it('rejects draft deployments and mismatched checkpoint bindings', () => {
    const draft = createStrategyDeployment({
      id: 'deployment-1',
      workspaceId: 'workspace-1',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'risk-1',
      riskPolicyVersion: 1,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      idempotencyKey: 'idem-draft',
    });

    expect(() =>
      createRuntimeContext({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        deployment: draft,
      }),
    ).toThrow(/approved strategy deployment/);

    const deployment = approvedDeployment();
    const wrongSession = createStrategyCheckpoint({
      workspaceId: 'workspace-1',
      deploymentId: deployment.id,
      sessionId: 'session-other',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T16:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-1',
      updatedAt: at,
    });

    expect(() =>
      createRuntimeContext({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        deployment,
        checkpoint: wrongSession,
      }),
    ).toThrow(/checkpoint session must match/);
  });

  it('builds diagnostics shell with evaluationEnabled true and idle worker', () => {
    const diagnostics = createRuntimeDiagnostics({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      checkpoint: null,
    });
    expect(diagnostics.evaluationEnabled).toBe(true);
    expect(diagnostics.workerState).toBe('IDLE');
    expect(diagnostics.acceptsTicks).toBe(false);
    expect(diagnostics.checkpointVersion).toBeNull();
    expect(Object.isFrozen(diagnostics)).toBe(true);
  });
});
