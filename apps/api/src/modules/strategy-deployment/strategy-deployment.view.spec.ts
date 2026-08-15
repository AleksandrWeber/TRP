import { describe, expect, it } from 'vitest';
import { StrategyDeploymentStatus } from './domain/strategy-deployment';
import { toStrategyDeploymentView } from './strategy-deployment.view';

describe('PC-03 Strategy Deployment product view', () => {
  it('exposes status, Library version, runtime stamp, and metadata without Session fields', () => {
    const view = toStrategyDeploymentView({
      id: 'dep-1',
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      experimentId: null,
      parameters: { period: 20 },
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config-us167',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
      configurationHash: 'abc',
      status: StrategyDeploymentStatus.DRAFT,
      version: 1,
      approvedAt: null,
      approvedByActorId: null,
      createdAt: '2026-08-15T12:00:00.000Z',
      recordedAt: '2026-08-15T12:00:00.000Z',
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
      metadata: { strategyName: 'Momentum' },
      enforcementAuthorization: {
        outcome: 'pass',
        validation: 'VALID',
        purpose: 'deployment_bind',
        libraryEntryId: 'lib-entry-1',
        certificationStatus: 'active',
        eligibilityOutcome: 'eligible',
        checkedAt: '2026-08-15T12:00:00.000Z',
        reasons: [],
      },
    });

    expect(view.status).toBe('draft');
    expect(view.strategyVersion).toBe('1.0.0');
    expect(view.libraryEntryId).toBe('lib-entry-1');
    expect(view.exchangeScopeId).toBe('binance-spot');
    expect(view.enforcementAuthorization?.outcome).toBe('pass');
    expect(view.metadata).toEqual({ strategyName: 'Momentum' });
    expect(view).not.toHaveProperty('sessionId');
    expect(view).not.toHaveProperty('automatic');
  });
});
