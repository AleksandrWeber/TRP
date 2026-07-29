import { describe, expect, it } from 'vitest';
import {
  approveStrategyDeployment,
  assertDeploymentMutable,
  createStrategyDeployment,
  StrategyDeploymentStatus,
  type CreateStrategyDeploymentInput,
} from './strategy-deployment';

const createdAt = '2026-07-29T12:00:00.000Z';

function baseInput(
  overrides: Partial<CreateStrategyDeploymentInput> = {},
): CreateStrategyDeploymentInput {
  return {
    id: 'deployment-1',
    workspaceId: 'workspace-1',
    strategyId: 'strategy-1',
    strategyVersion: '1.0.0',
    experimentId: 'experiment-1',
    parameters: { fast: 12, slow: 26 },
    instrument: 'btcusdt',
    timeframe: '1h',
    marketDataSourceId: 'binance-spot',
    paperExecutionConfigurationId: 'paper-config-us167',
    riskPolicyId: 'm2-baseline-paper-risk',
    riskPolicyVersion: 1,
    metadata: { label: 'ema-baseline' },
    createdAt,
    recordedAt: createdAt,
    actorId: 'trader-1',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

describe('US211 — Strategy Deployment domain', () => {
  it('creates a draft deployment with frozen configuration and provenance hash', () => {
    const deployment = createStrategyDeployment(baseInput());

    expect(deployment).toMatchObject({
      instrument: 'BTCUSDT',
      timeframe: '1h',
      status: StrategyDeploymentStatus.DRAFT,
      version: 1,
      approvedAt: null,
      approvedByActorId: null,
    });
    expect(deployment.configurationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.isFrozen(deployment)).toBe(true);
    expect(Object.isFrozen(deployment.parameters)).toBe(true);
    expect(deployment).not.toHaveProperty('sessionId');
    expect(deployment).not.toHaveProperty('lease');
    expect(deployment).not.toHaveProperty('checkpoint');
  });

  it('hashes only semantic configuration (stable across identical inputs)', () => {
    const first = createStrategyDeployment(baseInput({ id: 'a', idempotencyKey: 'a' }));
    const second = createStrategyDeployment(baseInput({ id: 'b', idempotencyKey: 'b' }));
    expect(first.configurationHash).toBe(second.configurationHash);

    const changed = createStrategyDeployment(
      baseInput({ id: 'c', idempotencyKey: 'c', parameters: { fast: 10, slow: 26 } }),
    );
    expect(changed.configurationHash).not.toBe(first.configurationHash);
  });

  it('rejects invalid instrument, timeframe, risk policy version, and empty ids', () => {
    expect(() => createStrategyDeployment(baseInput({ instrument: 'bt' }))).toThrow(
      /instrument must be 3-32/,
    );
    expect(() => createStrategyDeployment(baseInput({ timeframe: '2h' }))).toThrow(
      /unsupported timeframe/,
    );
    expect(() => createStrategyDeployment(baseInput({ riskPolicyVersion: 0 }))).toThrow(
      /positive integer/,
    );
    expect(() => createStrategyDeployment(baseInput({ strategyId: '  ' }))).toThrow(
      /strategy id is required/,
    );
  });

  it('approves a draft once and then treats the deployment as immutable', () => {
    const draft = createStrategyDeployment(baseInput());
    const approved = approveStrategyDeployment(draft, {
      approvedAt: '2026-07-29T12:01:00.000Z',
      approvedByActorId: 'admin-1',
      recordedAt: '2026-07-29T12:01:00.000Z',
    });

    expect(approved.status).toBe(StrategyDeploymentStatus.APPROVED);
    expect(approved.version).toBe(2);
    expect(approved.approvedByActorId).toBe('admin-1');
    expect(approved.configurationHash).toBe(draft.configurationHash);
    expect(() =>
      approveStrategyDeployment(approved, {
        approvedAt: '2026-07-29T12:02:00.000Z',
        approvedByActorId: 'admin-1',
        recordedAt: '2026-07-29T12:02:00.000Z',
      }),
    ).toThrow(/already approved/);
    expect(() => assertDeploymentMutable(approved)).toThrow(/immutable/);
  });
});
