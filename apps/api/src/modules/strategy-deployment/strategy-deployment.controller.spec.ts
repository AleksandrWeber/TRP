import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../identity/role';
import {
  RuntimeEnforcementRejectedError,
  type EnforcementReasonCode,
} from '../runtime-enforcement';
import { StrategyDeploymentStatus } from './domain/strategy-deployment';
import { StrategyDeploymentController } from './strategy-deployment.controller';
import type { StrategyDeploymentService } from './strategy-deployment.service';

const user = { userId: 'trader-1', role: Role.Trader, email: 't@example.com' };

function controllerHarness() {
  const deployments = {
    create: vi.fn(),
    approve: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
  };
  const commandAuthorization = {
    authorizeTradingCommand: vi.fn(({ workspaceId, idempotencyKey, correlationId }) =>
      Object.freeze({
        actorId: user.userId,
        workspaceId,
        role: Role.Trader,
        correlationId: correlationId ?? null,
        idempotencyKey: idempotencyKey ?? null,
      }),
    ),
  };
  const workspaceAccess = {
    assertMember: vi.fn(),
  };
  return {
    deployments,
    commandAuthorization,
    workspaceAccess,
    controller: new StrategyDeploymentController(
      deployments as unknown as StrategyDeploymentService,
      commandAuthorization as never,
      workspaceAccess as never,
    ),
  };
}

describe('US211 — StrategyDeploymentController', () => {
  it('requires Trader/Admin roles on create and approve', () => {
    expect(Reflect.getMetadata(ROLES_KEY, StrategyDeploymentController.prototype.create)).toEqual([
      Role.Trader,
      Role.Admin,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, StrategyDeploymentController.prototype.approve)).toEqual([
      Role.Trader,
      Role.Admin,
    ]);
  });

  it('creates and approves through authorized commands', async () => {
    const { controller, deployments } = controllerHarness();
    deployments.create.mockResolvedValue({
      id: 'deployment-1',
      workspaceId: 'ws-1',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      experimentId: null,
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'policy',
      riskPolicyVersion: 1,
      configurationHash: 'abc',
      status: StrategyDeploymentStatus.DRAFT,
      version: 1,
      approvedAt: null,
      approvedByActorId: null,
      createdAt: '2026-07-29T16:00:00.000Z',
      recordedAt: '2026-07-29T16:00:00.000Z',
      actorId: 'trader-1',
      correlationId: null,
      metadata: {},
    });
    deployments.approve.mockResolvedValue({
      id: 'deployment-1',
      workspaceId: 'ws-1',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      experimentId: null,
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'policy',
      riskPolicyVersion: 1,
      configurationHash: 'abc',
      status: StrategyDeploymentStatus.APPROVED,
      version: 2,
      approvedAt: '2026-07-29T16:01:00.000Z',
      approvedByActorId: 'trader-1',
      createdAt: '2026-07-29T16:00:00.000Z',
      recordedAt: '2026-07-29T16:01:00.000Z',
      actorId: 'trader-1',
      correlationId: null,
      metadata: {},
    });

    const created = await controller.create({ user } as never, 'ws-1', 'idem-1', undefined, {
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'policy',
      riskPolicyVersion: 1,
    });
    expect(created.status).toBe('draft');

    const approved = await controller.approve(
      { user } as never,
      { id: 'deployment-1' },
      'ws-1',
      undefined,
    );
    expect(approved.status).toBe('approved');
  });

  it('maps Runtime Enforcement INVALID to 422 with deterministic reasons', async () => {
    const { controller, deployments } = controllerHarness();
    deployments.create.mockRejectedValue(
      new RuntimeEnforcementRejectedError(
        Object.freeze({
          outcome: 'fail',
          validation: 'INVALID',
          reasons: Object.freeze(['eligibility_missing'] as EnforcementReasonCode[]),
          checkedAt: '2026-08-10T16:00:00.000Z',
        }),
      ),
    );

    await expect(
      controller.create({ user } as never, 'ws-1', 'idem-fail', undefined, {
        strategyId: 'strategy-1',
        strategyVersion: '1.0.0',
        parameters: {},
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config',
        riskPolicyId: 'policy',
        riskPolicyVersion: 1,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    try {
      await controller.create({ user } as never, 'ws-1', 'idem-fail-2', undefined, {
        strategyId: 'strategy-1',
        strategyVersion: '1.0.0',
        parameters: {},
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config',
        riskPolicyId: 'policy',
        riskPolicyVersion: 1,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      const body = (error as UnprocessableEntityException).getResponse() as Record<string, unknown>;
      expect(body.validation).toBe('INVALID');
      expect(body.reasons).toEqual(['eligibility_missing']);
    }
  });

  it('maps missing deployment to 404 and denied workspace to 403', async () => {
    const { controller, deployments, workspaceAccess } = controllerHarness();
    deployments.get.mockResolvedValue(null);
    await expect(
      controller.get({ user } as never, { id: 'missing' }, 'ws-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    workspaceAccess.assertMember.mockImplementation(() => {
      throw new Error('denied');
    });
    await expect(controller.list({ user } as never, 'ws-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
