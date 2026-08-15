import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnforcementReasonCode, RuntimeEnforcementPort } from '../runtime-enforcement';
import { RuntimeEnforcementRejectedError } from '../runtime-enforcement';
import type { StrategyDomainService } from '../strategies';
import { StrategyDeploymentStatus } from './domain/strategy-deployment';
import type { StrategyDeploymentRepository } from './persistence/strategy-deployment.repository';
import { StrategyDeploymentService } from './strategy-deployment.service';

const createdAt = '2026-07-29T15:00:00.000Z';

function passDecision() {
  return Object.freeze({
    outcome: 'pass' as const,
    validation: 'VALID' as const,
    reasons: Object.freeze([] as EnforcementReasonCode[]),
    libraryEntryId: 'lib-entry-1',
    certificationStatus: 'active',
    eligibilityOutcome: 'eligible' as const,
    checkedAt: createdAt,
  });
}

function failDecision(reasons: readonly EnforcementReasonCode[]) {
  return Object.freeze({
    outcome: 'fail' as const,
    validation: 'INVALID' as const,
    reasons: Object.freeze([...reasons]),
    checkedAt: createdAt,
  });
}

describe('US211 / RC-23 Epic 4 — StrategyDeploymentService', () => {
  const repository: StrategyDeploymentRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    listByWorkspace: vi.fn(),
  };
  const strategies = {
    getById: vi.fn(),
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = {
    append: vi.fn(async () => undefined),
  };
  const enforcement: RuntimeEnforcementPort = {
    validateDeployment: vi.fn(() => passDecision()),
  };

  let service: StrategyDeploymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforcement.validateDeployment).mockReturnValue(passDecision());
    service = new StrategyDeploymentService(
      repository,
      strategies as unknown as StrategyDomainService,
      transactions as never,
      outbox as never,
      enforcement,
    );
  });

  it('creates a draft deployment for an active strategy and appends Outbox', async () => {
    strategies.getById.mockResolvedValue({
      id: 'strategy-1',
      workspaceId: 'workspace-1',
      status: 'active',
    });
    vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(repository.create).mockImplementation(async (deployment) => deployment);

    const created = await service.create({
      workspaceId: 'workspace-1',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      parameters: { period: 20 },
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config-us167',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
      idempotencyKey: 'idem-create-1',
      actorId: 'trader-1',
      createdAt,
      recordedAt: createdAt,
    });

    expect(created.status).toBe(StrategyDeploymentStatus.DRAFT);
    expect(created.enforcementAuthorization).toEqual(
      expect.objectContaining({
        outcome: 'pass',
        validation: 'VALID',
        purpose: 'deployment_bind',
      }),
    );
    expect(repository.create).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(eventTypeFrom(outbox.append.mock.calls[0])).toBe('StrategyDeploymentCreated');
    expect(enforcement.validateDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        strategyFamilyId: 'strategy-1',
        strategyVersion: '1.0.0',
        purpose: 'deployment_bind',
      }),
    );
  });

  it('rejects create when strategy is missing or not active', async () => {
    vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(null);
    strategies.getById.mockResolvedValue(null);
    await expect(
      service.create({
        workspaceId: 'workspace-1',
        strategyId: 'missing',
        strategyVersion: '1.0.0',
        parameters: {},
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config-us167',
        riskPolicyId: 'm2-baseline-paper-risk',
        riskPolicyVersion: 1,
        idempotencyKey: 'idem-missing',
        actorId: 'trader-1',
        createdAt,
        recordedAt: createdAt,
      }),
    ).rejects.toThrow(/strategy not found/);
    expect(enforcement.validateDeployment).not.toHaveBeenCalled();

    strategies.getById.mockResolvedValue({
      id: 'strategy-1',
      workspaceId: 'workspace-1',
      status: 'draft',
    });
    await expect(
      service.create({
        workspaceId: 'workspace-1',
        strategyId: 'strategy-1',
        strategyVersion: '1.0.0',
        parameters: {},
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config-us167',
        riskPolicyId: 'm2-baseline-paper-risk',
        riskPolicyVersion: 1,
        idempotencyKey: 'idem-draft-strategy',
        actorId: 'trader-1',
        createdAt,
        recordedAt: createdAt,
      }),
    ).rejects.toThrow(/must be active/);
    expect(enforcement.validateDeployment).not.toHaveBeenCalled();
  });

  it('rejects create when Runtime Enforcement returns INVALID (no partial state)', async () => {
    strategies.getById.mockResolvedValue({
      id: 'strategy-1',
      workspaceId: 'workspace-1',
      status: 'active',
    });
    vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(enforcement.validateDeployment).mockReturnValue(
      failDecision(['certification_missing']),
    );

    await expect(
      service.create({
        workspaceId: 'workspace-1',
        strategyId: 'strategy-1',
        strategyVersion: '1.0.0',
        parameters: {},
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config-us167',
        riskPolicyId: 'm2-baseline-paper-risk',
        riskPolicyVersion: 1,
        idempotencyKey: 'idem-enforcement-fail',
        actorId: 'trader-1',
        createdAt,
        recordedAt: createdAt,
      }),
    ).rejects.toBeInstanceOf(RuntimeEnforcementRejectedError);

    expect(repository.create).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('approves a draft idempotently and freezes configuration when Gate PASSes', async () => {
    const draft = await (async () => {
      strategies.getById.mockResolvedValue({
        id: 'strategy-1',
        workspaceId: 'workspace-1',
        status: 'active',
      });
      vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(null);
      vi.mocked(repository.create).mockImplementation(async (deployment) => deployment);
      return service.create({
        workspaceId: 'workspace-1',
        strategyId: 'strategy-1',
        strategyVersion: '1.0.0',
        parameters: { period: 20 },
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config-us167',
        riskPolicyId: 'm2-baseline-paper-risk',
        riskPolicyVersion: 1,
        idempotencyKey: 'idem-approve-1',
        actorId: 'trader-1',
        createdAt,
        recordedAt: createdAt,
      });
    })();

    vi.mocked(repository.findById).mockResolvedValue(draft);
    vi.mocked(repository.save).mockImplementation(async (deployment) => deployment);

    const approved = await service.approve({
      workspaceId: 'workspace-1',
      deploymentId: draft.id,
      actorId: 'admin-1',
      approvedAt: '2026-07-29T15:01:00.000Z',
      recordedAt: '2026-07-29T15:01:00.000Z',
    });
    expect(approved.status).toBe(StrategyDeploymentStatus.APPROVED);
    expect(approved.configurationHash).toBe(draft.configurationHash);
    expect(eventTypeFrom(outbox.append.mock.calls.at(-1))).toBe('StrategyDeploymentApproved');

    vi.mocked(repository.findById).mockResolvedValue(approved);
    const again = await service.approve({
      workspaceId: 'workspace-1',
      deploymentId: draft.id,
      actorId: 'admin-1',
      approvedAt: '2026-07-29T15:02:00.000Z',
      recordedAt: '2026-07-29T15:02:00.000Z',
    });
    expect(again).toBe(approved);
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('rejects approve when Runtime Enforcement returns INVALID (no APPROVED / Session-startable state)', async () => {
    const draft = {
      id: 'dep-1',
      workspaceId: 'workspace-1',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1h',
      status: StrategyDeploymentStatus.DRAFT,
      version: 1,
      configurationHash: 'hash',
    } as never;

    vi.mocked(repository.findById).mockResolvedValue(draft);
    vi.mocked(enforcement.validateDeployment).mockReturnValue(
      failDecision(['eligibility_missing']),
    );

    await expect(
      service.approve({
        workspaceId: 'workspace-1',
        deploymentId: 'dep-1',
        actorId: 'admin-1',
        approvedAt: '2026-07-29T15:01:00.000Z',
        recordedAt: '2026-07-29T15:01:00.000Z',
      }),
    ).rejects.toMatchObject({
      name: 'RuntimeEnforcementRejectedError',
      validation: 'INVALID',
      reasons: ['eligibility_missing'],
    });

    expect(repository.save).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('preserves deterministic rejection reasons from the Gate', async () => {
    strategies.getById.mockResolvedValue({
      id: 'strategy-1',
      workspaceId: 'workspace-1',
      status: 'active',
    });
    vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(enforcement.validateDeployment).mockReturnValue(
      failDecision(['strategy_version_not_found']),
    );

    try {
      await service.create({
        workspaceId: 'workspace-1',
        strategyId: 'strategy-1',
        strategyVersion: '9.9.9',
        parameters: {},
        instrument: 'BTCUSDT',
        timeframe: '1h',
        marketDataSourceId: 'binance-spot',
        paperExecutionConfigurationId: 'paper-config-us167',
        riskPolicyId: 'm2-baseline-paper-risk',
        riskPolicyVersion: 1,
        idempotencyKey: 'idem-reasons',
        actorId: 'trader-1',
        createdAt,
        recordedAt: createdAt,
      });
      expect.unreachable('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(RuntimeEnforcementRejectedError);
      expect((error as RuntimeEnforcementRejectedError).reasons).toEqual([
        'strategy_version_not_found',
      ]);
      expect((error as RuntimeEnforcementRejectedError).decision.validation).toBe('INVALID');
    }
  });

  it('lists and gets workspace-scoped deployments', async () => {
    const listed = [{ id: 'd1' }] as never;
    vi.mocked(repository.listByWorkspace).mockResolvedValue(listed);
    vi.mocked(repository.findById).mockResolvedValue(null);
    expect(await service.list('workspace-1')).toBe(listed);
    expect(await service.get('workspace-1', 'missing')).toBeNull();
  });

  it('passes Library identity to the Gate when libraryEntryId is provided', async () => {
    strategies.getById.mockResolvedValue({
      id: 'strategy-1',
      workspaceId: 'workspace-1',
      status: 'active',
    });
    vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(repository.create).mockImplementation(async (deployment) => deployment);

    await service.create({
      workspaceId: 'workspace-1',
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      libraryEntryId: 'lib-entry-1',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config-us167',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
      idempotencyKey: 'idem-library-1',
      actorId: 'trader-1',
      createdAt,
      recordedAt: createdAt,
    });

    const gateRequest = vi.mocked(enforcement.validateDeployment).mock.calls[0]?.[0];
    expect(gateRequest).toEqual(
      expect.objectContaining({
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
      }),
    );
    expect(gateRequest).not.toHaveProperty('strategyFamilyId');
    expect(strategies.getById).toHaveBeenCalledWith('workspace-1', 'strategy-1');
  });
});

function eventTypeFrom(call: unknown): string | undefined {
  if (!Array.isArray(call) || call.length < 2) return undefined;
  const envelope = call[1] as { eventType?: string };
  return envelope.eventType;
}
