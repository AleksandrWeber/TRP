import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StrategyDomainService } from '../strategies';
import { StrategyDeploymentStatus } from './domain/strategy-deployment';
import type { StrategyDeploymentRepository } from './persistence/strategy-deployment.repository';
import { StrategyDeploymentService } from './strategy-deployment.service';

const createdAt = '2026-07-29T15:00:00.000Z';

describe('US211 — StrategyDeploymentService', () => {
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

  let service: StrategyDeploymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StrategyDeploymentService(
      repository,
      strategies as unknown as StrategyDomainService,
      transactions as never,
      outbox as never,
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
    expect(repository.create).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(eventTypeFrom(outbox.append.mock.calls[0])).toBe('StrategyDeploymentCreated');
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
  });

  it('approves a draft idempotently and freezes configuration', async () => {
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

  it('lists and gets workspace-scoped deployments', async () => {
    const listed = [{ id: 'd1' }] as never;
    vi.mocked(repository.listByWorkspace).mockResolvedValue(listed);
    vi.mocked(repository.findById).mockResolvedValue(null);
    expect(await service.list('workspace-1')).toBe(listed);
    expect(await service.get('workspace-1', 'missing')).toBeNull();
  });
});

function eventTypeFrom(call: unknown): string | undefined {
  if (!Array.isArray(call) || call.length < 2) return undefined;
  const envelope = call[1] as { eventType?: string };
  return envelope.eventType;
}
