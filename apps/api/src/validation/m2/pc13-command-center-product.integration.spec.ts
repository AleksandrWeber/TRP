import { UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CommandAuthorizationService } from '../../modules/auth/command-authorization.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { BotFacadeService } from '../../modules/bot-facade/bot-facade.service';
import { PaperAccountController } from '../../modules/paper-account/paper-account.controller';
import {
  PaperAccountStatus,
  type PaperAccount,
} from '../../modules/paper-account/domain/paper-account';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import type { PaperAccountRepository } from '../../modules/paper-account/persistence/paper-account.repository';
import { Role } from '../../modules/identity/role';
import { TradingSessionCommandController } from '../../modules/bot-facade/trading-session-command.controller';
import { TradingSessionQueryController } from '../../modules/bot-facade/trading-session-query.controller';
import { StrategyDeploymentStatus } from '../../modules/strategy-deployment';
import type { StrategyRuntimePort } from '../../modules/strategy-runtime/ports/strategy-runtime.port';
import type { TradingSession } from '../../modules/trading-session/domain/trading-session';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import type { TradingSessionRepository } from '../../modules/trading-session/persistence/trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';

const OWNER: AuthUser = {
  userId: 'pc13-owner',
  email: 'pc13@example.com',
  displayName: 'PC-13',
  role: Role.Trader,
};

const at = '2026-08-15T14:00:00.000Z';

class InMemoryPaperAccountRepository implements PaperAccountRepository {
  private readonly items: PaperAccount[] = [];
  private readonly keys = new Map<string, string>();

  async create(
    account: PaperAccount,
    idempotencyKey: string,
    _transaction: TransactionContext,
  ): Promise<PaperAccount> {
    this.items.push(account);
    this.keys.set(`${account.workspaceId}:${idempotencyKey}`, account.id);
    return account;
  }

  async save(account: PaperAccount): Promise<PaperAccount> {
    const index = this.items.findIndex((item) => item.id === account.id);
    if (index >= 0) this.items[index] = account;
    return account;
  }

  async findById(workspaceId: string, accountId: string): Promise<PaperAccount | null> {
    return (
      this.items.find((item) => item.workspaceId === workspaceId && item.id === accountId) ?? null
    );
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<PaperAccount | null> {
    const id = this.keys.get(`${workspaceId}:${idempotencyKey}`);
    if (!id) return null;
    return this.findById(workspaceId, id);
  }
}

class InMemoryTradingSessionRepository implements TradingSessionRepository {
  private readonly items: TradingSession[] = [];

  async create(session: TradingSession): Promise<TradingSession> {
    this.items.push(session);
    return session;
  }

  async save(session: TradingSession): Promise<TradingSession> {
    const index = this.items.findIndex((item) => item.id === session.id);
    if (index >= 0) this.items[index] = session;
    else this.items.push(session);
    return session;
  }

  async saveIfVersion(
    session: TradingSession,
    expectedVersion: number,
  ): Promise<TradingSession | null> {
    const current = this.items.find((item) => item.id === session.id);
    if (!current || current.version !== expectedVersion) return null;
    return this.save(session);
  }

  async findById(workspaceId: string, sessionId: string): Promise<TradingSession | null> {
    return (
      this.items.find((item) => item.workspaceId === workspaceId && item.id === sessionId) ?? null
    );
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<TradingSession | null> {
    return (
      this.items.find(
        (item) => item.workspaceId === workspaceId && item.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }

  async findByWorkspaceId(workspaceId: string): Promise<TradingSession[]> {
    return this.items.filter((item) => item.workspaceId === workspaceId);
  }

  async findByStatuses(statuses: readonly TradingSessionStatus[]): Promise<TradingSession[]> {
    return this.items.filter((item) => statuses.includes(item.status));
  }
}

function harness() {
  const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  const access = new WorkspaceAccessService(workspaces);
  const commandAuthorization = new CommandAuthorizationService(access);
  const paperAccounts = new InMemoryPaperAccountRepository();
  const sessions = new InMemoryTradingSessionRepository();
  const transactions = {
    run: async (fn: (tx: TransactionContext) => Promise<unknown>) => fn({} as TransactionContext),
  };
  const outbox = { append: async () => undefined };
  const paperService = new PaperAccountService(
    paperAccounts,
    transactions as never,
    outbox as never,
  );
  const deployments = {
    get: vi.fn(async (_workspaceId: string, deploymentId: string) =>
      deploymentId === 'dep-approved'
        ? {
            id: 'dep-approved',
            workspaceId: _workspaceId,
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
          }
        : deploymentId === 'dep-draft'
          ? { id: 'dep-draft', workspaceId: _workspaceId, status: StrategyDeploymentStatus.DRAFT }
          : null,
    ),
  };
  const runtime: StrategyRuntimePort = {
    loadContext: vi.fn(async () => ({}) as never),
    getDiagnostics: vi.fn(async (workspaceId, sessionId) =>
      Object.freeze({
        workspaceId,
        sessionId,
        deploymentId: 'dep-approved',
        checkpointVersion: null,
        lastProcessedEventId: null,
        lastProcessedCandleSequence: null,
        runtimeVersion: '1',
        evaluationEnabled: true,
        workerState: 'ARMED',
        acceptsTicks: true,
      }),
    ),
    getLifecycle: vi.fn(async (workspaceId, sessionId) =>
      Object.freeze({
        workspaceId,
        sessionId,
        state: 'ARMED',
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      }),
    ),
    arm: vi.fn(async () => ({ toState: 'ARMED', fromState: 'IDLE' }) as never),
    pause: vi.fn(async () => ({ toState: 'IDLE' }) as never),
    resume: vi.fn(async () => ({ toState: 'ARMED' }) as never),
    stop: vi.fn(async () => ({ toState: 'IDLE' }) as never),
    enableEventAdmission: vi.fn(),
    admitTick: vi.fn(),
    evaluate: vi.fn(),
    emitSignalIntent: vi.fn(),
    listSignalIntents: vi.fn(),
    saveCheckpoint: vi.fn(),
    loadCheckpoint: vi.fn(),
  };
  const sessionService = new TradingSessionService(
    sessions,
    paperAccounts,
    transactions as never,
    outbox as never,
    deployments as never,
    runtime,
  );
  const bots = new BotFacadeService(sessionService, sessions);
  const paperController = new PaperAccountController(paperService, commandAuthorization);
  const commands = new TradingSessionCommandController(bots, commandAuthorization);
  const queries = new TradingSessionQueryController(bots, access, runtime);
  return { workspaces, paperController, commands, queries, runtime };
}

/**
 * PC-13: Command Center REST over existing Session / Paper Account / Runtime reads.
 * Trading Session remains Session owner. No Orders, Kill Switch, or Live Trading.
 */
describe('PC-13 — Command Center product', () => {
  it('lets a user create, start, monitor, pause, resume, and stop a paper session', async () => {
    const { workspaces, paperController, commands, queries, runtime } = harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const req = { user: OWNER };

    const account = await paperController.create(req, workspace.id, undefined, undefined, {
      currency: 'USDT',
      openingCapital: '100000',
      mode: 'paper',
    });
    expect(account.mode).toBe('paper');
    expect(account.status).toBe(PaperAccountStatus.PENDING_OPENING_LEDGER);

    const created = await commands.create(req, workspace.id, undefined, undefined, {
      paperAccountId: account.id,
      deploymentId: 'dep-approved',
      origin: 'strategy',
      idempotencyKey: 'pc13-session-1',
    });
    expect(created.origin).toBe('strategy');
    expect(created.status).toBe(TradingSessionStatus.CREATED);
    expect(created.id).toBe(created.tradingSessionId);
    expect(created.mission.deploymentId).toBe('dep-approved');

    const started = await commands.start(req, created.id, workspace.id);
    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(started.leaseOwnerId).toBe(OWNER.userId);
    expect(runtime.arm).toHaveBeenCalled();

    const listed = await queries.list(req, workspace.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    const detail = await queries.get(req, created.id, workspace.id);
    expect(detail.health.lifecycleStatus).toBe(TradingSessionStatus.RUNNING);
    expect(detail.health.leasePresent).toBe(true);
    expect(detail.runtimeStatus.workerState).toBe('ARMED');
    expect(detail.deploymentReference.deploymentId).toBe('dep-approved');

    const paused = await commands.pause(req, created.id, workspace.id);
    expect(paused.status).toBe(TradingSessionStatus.PAUSED);
    const resumed = await commands.resume(req, created.id, workspace.id);
    expect(resumed.status).toBe(TradingSessionStatus.RUNNING);
    const stopped = await commands.stop(req, created.id, workspace.id);
    expect(stopped.status).toBe(TradingSessionStatus.STOPPED);
  });

  it('refuses an unapproved Deployment and does not invent live trading', async () => {
    const { workspaces, paperController, commands } = harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const req = { user: OWNER };
    const account = await paperController.create(req, workspace.id, undefined, undefined, {
      currency: 'USDT',
      openingCapital: '100000',
      mode: 'paper',
      idempotencyKey: 'acct-draft',
    });

    await expect(
      commands.create(req, workspace.id, undefined, undefined, {
        paperAccountId: account.id,
        deploymentId: 'dep-draft',
        origin: 'strategy',
        idempotencyKey: 'pc13-draft',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(commands.create.toString()).not.toContain('live');
  });
});
