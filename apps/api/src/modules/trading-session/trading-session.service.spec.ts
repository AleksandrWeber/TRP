import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaperAccountStatus } from '../paper-account/domain/paper-account';
import type { PaperAccountRepository } from '../paper-account/persistence/paper-account.repository';
import { StrategyDeploymentStatus, type StrategyDeploymentService } from '../strategy-deployment';
import type { StrategyRuntimePort } from '../strategy-runtime';
import { TradingSessionStatus } from './domain/trading-session-status';
import type { TradingSessionRepository } from './persistence/trading-session.repository';
import { TradingSessionService } from './trading-session.service';

const at = '2026-07-29T19:00:00.000Z';

function approvedAuthorizedDeployment() {
  return {
    id: 'deployment-1',
    workspaceId: 'workspace-1',
    status: StrategyDeploymentStatus.APPROVED,
    enforcementAuthorization: Object.freeze({
      outcome: 'pass' as const,
      validation: 'VALID' as const,
      purpose: 'deployment_bind' as const,
      libraryEntryId: 'lib-entry-1',
      certificationStatus: 'active',
      eligibilityOutcome: 'eligible' as const,
      checkedAt: at,
      reasons: Object.freeze([]),
    }),
  };
}

describe('US217/US220 — TradingSessionService Deployment binding + Runtime lifecycle', () => {
  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByWorkspaceId: vi.fn(),
    findByStatuses: vi.fn(),
    saveIfVersion: vi.fn(),
  };
  const accounts: PaperAccountRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = {
    append: vi.fn(async () => undefined),
  };
  const deployments = {
    get: vi.fn(),
  };
  const runtime = {
    loadContext: vi.fn(),
    getDiagnostics: vi.fn(),
    getLifecycle: vi.fn(),
    arm: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    admitTick: vi.fn(),
    evaluate: vi.fn(),
    emitSignalIntent: vi.fn(),
    listSignalIntents: vi.fn(),
    saveCheckpoint: vi.fn(),
    loadCheckpoint: vi.fn(),
  };

  let service: TradingSessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TradingSessionService(
      sessions,
      accounts,
      transactions as never,
      outbox as never,
      deployments as unknown as StrategyDeploymentService,
      runtime as unknown as StrategyRuntimePort,
    );
    vi.mocked(accounts.findById).mockResolvedValue({
      id: 'account-1',
      workspaceId: 'workspace-1',
      status: PaperAccountStatus.ACTIVE,
    } as never);
  });

  it('creates a strategy-origin session bound to an approved Deployment', async () => {
    vi.mocked(sessions.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(deployments.get).mockResolvedValue({
      id: 'deployment-1',
      workspaceId: 'workspace-1',
      status: StrategyDeploymentStatus.APPROVED,
    });
    vi.mocked(sessions.create).mockImplementation(async (session) => session);

    const created = await service.create({
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-1',
      origin: 'strategy',
      idempotencyKey: 'idem-strategy-1',
      actorId: 'trader-1',
      createdAt: at,
      recordedAt: at,
    });

    expect(created.origin).toBe('strategy');
    expect(created.deploymentId).toBe('deployment-1');
    expect(deployments.get).toHaveBeenCalledWith('workspace-1', 'deployment-1');
    expect(runtime.loadContext).not.toHaveBeenCalled();
  });

  it('rejects strategy create when Deployment is missing or not approved', async () => {
    vi.mocked(sessions.findByIdempotencyKey).mockResolvedValue(null);
    deployments.get.mockResolvedValue(null);
    await expect(
      service.create({
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        deploymentId: 'missing',
        origin: 'strategy',
        idempotencyKey: 'idem-missing',
        actorId: 'trader-1',
        createdAt: at,
        recordedAt: at,
      }),
    ).rejects.toThrow(/strategy deployment not found/);

    deployments.get.mockResolvedValue({
      id: 'deployment-draft',
      workspaceId: 'workspace-1',
      status: StrategyDeploymentStatus.DRAFT,
    });
    await expect(
      service.create({
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        deploymentId: 'deployment-draft',
        origin: 'strategy',
        idempotencyKey: 'idem-draft',
        actorId: 'trader-1',
        createdAt: at,
        recordedAt: at,
      }),
    ).rejects.toThrow(/approved strategy deployment/);
  });

  it('initializes RuntimeContext through RuntimePort on strategy start', async () => {
    const session = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'deployment-1',
      origin: 'strategy' as const,
      status: TradingSessionStatus.CREATED,
      lease: null,
      lastFencingToken: 0,
      version: 1,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
    };
    vi.mocked(sessions.findById).mockResolvedValue(session);
    vi.mocked(deployments.get).mockResolvedValue(approvedAuthorizedDeployment());
    vi.mocked(runtime.loadContext).mockResolvedValue({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
    } as never);
    vi.mocked(runtime.arm).mockResolvedValue({
      toState: 'ARMED',
      fromState: 'IDLE',
      drained: false,
    } as never);
    vi.mocked(runtime.pause).mockResolvedValue({
      toState: 'IDLE',
      fromState: 'ARMED',
      drained: false,
    } as never);
    vi.mocked(runtime.resume).mockResolvedValue({
      toState: 'ARMED',
      fromState: 'IDLE',
      drained: false,
    } as never);
    vi.mocked(runtime.stop).mockResolvedValue({
      toState: 'IDLE',
      fromState: 'ARMED',
      drained: false,
    } as never);
    vi.mocked(sessions.save).mockImplementation(async (next) => next);

    const started = await service.start({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: at,
      nowIso: at,
    });

    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(runtime.loadContext).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(runtime.arm).toHaveBeenCalledOnce();
    expect(runtime.emitSignalIntent).not.toHaveBeenCalled();
    expect(runtime.saveCheckpoint).not.toHaveBeenCalled();
  });

  it('drains Runtime on strategy pause/resume/stop without touching Intent persistence', async () => {
    const running = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'deployment-1',
      origin: 'strategy' as const,
      status: TradingSessionStatus.RUNNING,
      lease: {
        ownerId: 'worker-1',
        fencingToken: 1,
        acquiredAt: at,
        expiresAt: '2026-07-29T19:01:00.000Z',
        heartbeatAt: at,
      },
      lastFencingToken: 1,
      version: 2,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
    };
    vi.mocked(sessions.findById).mockResolvedValue(running);
    vi.mocked(sessions.save).mockImplementation(async (next) => next);
    vi.mocked(runtime.pause).mockResolvedValue({ toState: 'IDLE' } as never);
    vi.mocked(runtime.resume).mockResolvedValue({ toState: 'ARMED' } as never);
    vi.mocked(runtime.stop).mockResolvedValue({ toState: 'IDLE' } as never);

    const paused = await service.pause({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      actorId: 'trader-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });
    expect(paused.status).toBe(TradingSessionStatus.PAUSED);
    expect(runtime.pause).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1', fencingToken: 1 }),
    );

    vi.mocked(sessions.findById).mockResolvedValue({
      ...paused,
      lease: running.lease,
      status: TradingSessionStatus.PAUSED,
    });
    const resumed = await service.resume({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      actorId: 'trader-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });
    expect(resumed.status).toBe(TradingSessionStatus.RUNNING);
    expect(runtime.resume).toHaveBeenCalledOnce();

    vi.mocked(sessions.findById).mockResolvedValue({
      ...resumed,
      lease: running.lease,
      status: TradingSessionStatus.RUNNING,
    });
    const stopped = await service.stop({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      actorId: 'trader-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });
    expect(stopped.status).toBe(TradingSessionStatus.STOPPED);
    expect(runtime.stop).toHaveBeenCalledOnce();
    expect(runtime.emitSignalIntent).not.toHaveBeenCalled();
    expect(runtime.saveCheckpoint).not.toHaveBeenCalled();
  });

  it('does not call RuntimePort on manual start', async () => {
    const session = {
      id: 'session-manual',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'manual-deployment-1',
      origin: 'manual' as const,
      status: TradingSessionStatus.CREATED,
      lease: null,
      lastFencingToken: 0,
      version: 1,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-manual',
    };
    vi.mocked(sessions.findById).mockResolvedValue(session);
    vi.mocked(sessions.save).mockImplementation(async (next) => next);

    await service.start({
      workspaceId: 'workspace-1',
      sessionId: 'session-manual',
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: at,
      nowIso: at,
    });

    expect(runtime.loadContext).not.toHaveBeenCalled();
  });

  it('aborts strategy start when RuntimeContext initialization fails', async () => {
    const session = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'deployment-1',
      origin: 'strategy' as const,
      status: TradingSessionStatus.CREATED,
      lease: null,
      lastFencingToken: 0,
      version: 1,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
    };
    vi.mocked(sessions.findById).mockResolvedValue(session);
    vi.mocked(deployments.get).mockResolvedValue(approvedAuthorizedDeployment());
    vi.mocked(runtime.loadContext).mockRejectedValue(
      new Error('runtime context requires an approved strategy deployment'),
    );

    await expect(
      service.start({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        actorId: 'trader-1',
        ownerId: 'worker-1',
        recordedAt: at,
        nowIso: at,
      }),
    ).rejects.toThrow(/approved strategy deployment/);
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('creates manual sessions without Deployment lookup', async () => {
    vi.mocked(sessions.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(sessions.create).mockImplementation(async (session) => session);

    const created = await service.create({
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      deploymentId: 'manual-deployment-1',
      origin: 'manual',
      idempotencyKey: 'idem-manual-create',
      actorId: 'trader-1',
      createdAt: at,
      recordedAt: at,
    });

    expect(created.origin).toBe('manual');
    expect(deployments.get).not.toHaveBeenCalled();
  });

  it('RC-23 Epic 5: starts when Deployment carries prior Gate PASS authorization', async () => {
    const session = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'deployment-1',
      origin: 'strategy' as const,
      status: TradingSessionStatus.CREATED,
      lease: null,
      lastFencingToken: 0,
      version: 1,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
    };
    vi.mocked(sessions.findById).mockResolvedValue(session);
    vi.mocked(deployments.get).mockResolvedValue(approvedAuthorizedDeployment());
    vi.mocked(runtime.loadContext).mockResolvedValue({} as never);
    vi.mocked(runtime.arm).mockResolvedValue({} as never);
    vi.mocked(sessions.save).mockImplementation(async (next) => next);

    const started = await service.start({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: at,
      nowIso: at,
    });

    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(deployments.get).toHaveBeenCalledWith('workspace-1', 'deployment-1');
    // Session must not re-run Gate — Deployment service has no validateDeployment here.
    expect(deployments).not.toHaveProperty('validateDeployment');
  });

  it('RC-23 Epic 5: refuses start when enforcement authorization is missing', async () => {
    const session = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'deployment-1',
      origin: 'strategy' as const,
      status: TradingSessionStatus.CREATED,
      lease: null,
      lastFencingToken: 0,
      version: 1,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
    };
    vi.mocked(sessions.findById).mockResolvedValue(session);
    vi.mocked(deployments.get).mockResolvedValue({
      id: 'deployment-1',
      workspaceId: 'workspace-1',
      status: StrategyDeploymentStatus.APPROVED,
      enforcementAuthorization: null,
    });

    await expect(
      service.start({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        actorId: 'trader-1',
        ownerId: 'worker-1',
        recordedAt: at,
        nowIso: at,
      }),
    ).rejects.toMatchObject({
      name: 'DeploymentAuthorizationRefusedError',
      reasons: ['enforcement_authorization_missing'],
    });
    expect(runtime.loadContext).not.toHaveBeenCalled();
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('RC-23 Epic 5: refuses start when enforcement authorization is invalid', async () => {
    const session = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      exchangeScopeId: 'exchange-scope:binance',
      tacticalEnvelope: null,
      deploymentId: 'deployment-1',
      origin: 'strategy' as const,
      status: TradingSessionStatus.CREATED,
      lease: null,
      lastFencingToken: 0,
      version: 1,
      failureReason: null,
      createdAt: at,
      recordedAt: at,
      actorId: 'trader-1',
      correlationId: null,
      idempotencyKey: 'idem-1',
    };
    vi.mocked(sessions.findById).mockResolvedValue(session);
    vi.mocked(deployments.get).mockResolvedValue({
      id: 'deployment-1',
      workspaceId: 'workspace-1',
      status: StrategyDeploymentStatus.APPROVED,
      enforcementAuthorization: {
        outcome: 'fail',
        validation: 'INVALID',
        purpose: 'deployment_bind',
        libraryEntryId: null,
        certificationStatus: null,
        eligibilityOutcome: null,
        checkedAt: at,
        reasons: ['eligibility_missing'],
      },
    });

    await expect(
      service.start({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        actorId: 'trader-1',
        ownerId: 'worker-1',
        recordedAt: at,
        nowIso: at,
      }),
    ).rejects.toMatchObject({
      name: 'DeploymentAuthorizationRefusedError',
      reasons: ['enforcement_authorization_invalid'],
    });
    expect(runtime.loadContext).not.toHaveBeenCalled();
    expect(sessions.save).not.toHaveBeenCalled();
  });
});
