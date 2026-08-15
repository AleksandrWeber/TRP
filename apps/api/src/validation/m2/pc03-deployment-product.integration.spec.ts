import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { InMemoryStrategyLibraryReadAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../modules/strategy-library/domain/strategy';
import { createStrategyCertification } from '../../modules/strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../modules/strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../modules/strategy-library/domain/strategy-version';
import { validateDeployment } from '../../modules/runtime-enforcement/domain/validate-deployment';
import { RuntimeEnforcementLibraryReadService } from '../../modules/runtime-enforcement/runtime-enforcement-library-read.service';
import type { RuntimeEnforcementPort } from '../../modules/runtime-enforcement/ports/runtime-enforcement.port';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';
import { StrategyDeploymentController } from '../../modules/strategy-deployment/strategy-deployment.controller';
import { StrategyDeploymentService } from '../../modules/strategy-deployment/strategy-deployment.service';
import type { StrategyDeploymentRepository } from '../../modules/strategy-deployment/persistence/strategy-deployment.repository';
import type { StrategyDeployment } from '../../modules/strategy-deployment/domain/strategy-deployment';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';

const OWNER: AuthUser = {
  userId: 'pc03-trader',
  email: 'pc03@example.com',
  displayName: 'PC-03',
  role: Role.Trader,
};

const createdAt = '2026-08-15T12:00:00.000Z';

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter, workspaceId: string) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId,
    createdAt,
    registryRef: 'st-1',
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedSymbols: ['BTCUSDT'],
    workspaceId,
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: OWNER.userId,
    certifiedAt: createdAt,
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: {
      envelopeVersion: 'env-1',
      allowedMarkets: ['crypto-spot'],
      allowedExchangeScopeIds: ['binance-spot'],
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['1h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt: createdAt,
  });
  adapter.seedEntry({ strategy, version, certification, eligibility });
}

class InMemoryStrategyDeploymentRepository implements StrategyDeploymentRepository {
  private readonly items: StrategyDeployment[] = [];

  async create(
    deployment: StrategyDeployment,
    _transaction?: TransactionContext,
  ): Promise<StrategyDeployment> {
    this.items.push(deployment);
    return deployment;
  }

  async save(
    deployment: StrategyDeployment,
    expectedVersion: number,
    _transaction?: TransactionContext,
  ): Promise<StrategyDeployment> {
    const index = this.items.findIndex((item) => item.id === deployment.id);
    if (index < 0 || this.items[index]?.version !== expectedVersion) {
      throw new Error('strategy deployment not found in workspace');
    }
    this.items[index] = deployment;
    return deployment;
  }

  async findById(workspaceId: string, deploymentId: string): Promise<StrategyDeployment | null> {
    return (
      this.items.find((item) => item.workspaceId === workspaceId && item.id === deploymentId) ??
      null
    );
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<StrategyDeployment | null> {
    return (
      this.items.find(
        (item) => item.workspaceId === workspaceId && item.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }

  async listByWorkspace(workspaceId: string): Promise<StrategyDeployment[]> {
    return this.items.filter((item) => item.workspaceId === workspaceId);
  }
}

function harness() {
  const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  const library = new InMemoryStrategyLibraryReadAdapter();
  const reads = new RuntimeEnforcementLibraryReadService(library, library);
  const gate: RuntimeEnforcementPort = {
    validateDeployment: (cmd) =>
      validateDeployment(cmd, {
        getByLibraryEntryId: (id) => reads.getByLibraryEntryId(id),
        getByFamilyVersion: (familyId, version) => reads.getByFamilyVersion(familyId, version),
        familyExistsInWorkspace: (workspaceId, strategyFamilyId) =>
          reads.familyExistsInWorkspace(workspaceId, strategyFamilyId),
      }),
  };
  const deployments = new InMemoryStrategyDeploymentRepository();
  const strategies = {
    getById: async (_workspaceId: string, id: string) =>
      id === 'st-1' ? { id: 'st-1', workspaceId: _workspaceId, status: 'active' as const } : null,
  };
  const service = new StrategyDeploymentService(
    deployments,
    strategies as never,
    {
      run: async (fn: (tx: TransactionContext) => Promise<unknown>) => fn({} as TransactionContext),
    } as never,
    { append: async () => undefined } as never,
    gate,
  );
  const access = new WorkspaceAccessService(workspaces);
  const commandAuthorization = {
    authorizeTradingCommand: ({
      workspaceId,
      idempotencyKey,
      correlationId,
    }: {
      workspaceId: string;
      idempotencyKey?: string;
      correlationId?: string;
    }) =>
      Object.freeze({
        actorId: OWNER.userId,
        workspaceId,
        role: Role.Trader,
        correlationId: correlationId ?? null,
        idempotencyKey: idempotencyKey ?? null,
      }),
  };
  const controller = new StrategyDeploymentController(
    service,
    commandAuthorization as never,
    access,
  );
  return { workspaces, library, controller };
}

const createBody = {
  strategyId: 'st-1',
  strategyVersion: '1.0.0',
  libraryEntryId: 'lib-entry-1',
  parameters: {},
  instrument: 'BTCUSDT',
  timeframe: '1h',
  marketDataSourceId: 'binance-spot',
  paperExecutionConfigurationId: 'paper-config-us167',
  riskPolicyId: 'm2-baseline-paper-risk',
  riskPolicyVersion: 1,
  metadata: { strategyName: 'Momentum' },
};

/**
 * PC-03: Deployment HTTP over the existing Strategy Deployment owner.
 * Library remains SoT. Runtime remains Gate. Session stays unchanged.
 */
describe('PC-03 — Deployment product', () => {
  it('creates, lists, shows status / runtime result / library version, and approves', async () => {
    const { workspaces, library, controller } = harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    seedEligible(library, workspace.id);

    const created = await controller.create(
      { user: OWNER } as never,
      workspace.id,
      'idem-pc03-1',
      undefined,
      createBody,
    );
    expect(created.status).toBe('draft');
    expect(created.strategyVersion).toBe('1.0.0');
    expect(created.libraryEntryId).toBe('lib-entry-1');
    expect(created.enforcementAuthorization?.outcome).toBe('pass');
    expect(created.metadata).toEqual({ strategyName: 'Momentum' });
    expect(created).not.toHaveProperty('sessionId');

    const listed = await controller.list({ user: OWNER } as never, workspace.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    const detail = await controller.get({ user: OWNER } as never, { id: created.id }, workspace.id);
    expect(detail.strategyVersion).toBe('1.0.0');
    expect(detail.enforcementAuthorization?.validation).toBe('VALID');

    const approved = await controller.approve(
      { user: OWNER } as never,
      { id: created.id },
      workspace.id,
      undefined,
    );
    expect(approved.status).toBe('approved');
    expect(approved.configurationHash).toBe(created.configurationHash);
    expect(approved.approvedByActorId).toBe(OWNER.userId);
  });

  it('rejects create when the Gate FAILs and does not persist a draft', async () => {
    const { workspaces, controller } = harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });

    await expect(
      controller.create({ user: OWNER } as never, workspace.id, 'idem-fail', undefined, {
        ...createBody,
        libraryEntryId: undefined,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    const listed = await controller.list({ user: OWNER } as never, workspace.id);
    expect(listed).toHaveLength(0);
  });

  it('requires workspace header and isolates foreign workspaces', async () => {
    const { workspaces, library, controller } = harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    seedEligible(library, workspace.id);
    const created = await controller.create(
      { user: OWNER } as never,
      workspace.id,
      'idem-pc03-2',
      undefined,
      createBody,
    );

    await expect(controller.list({ user: OWNER } as never, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    const stranger: AuthUser = {
      userId: 'stranger',
      email: 'x@example.com',
      displayName: 'X',
      role: Role.Trader,
    };
    await expect(controller.list({ user: stranger } as never, workspace.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      controller.get({ user: OWNER } as never, { id: created.id }, 'other-workspace'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
