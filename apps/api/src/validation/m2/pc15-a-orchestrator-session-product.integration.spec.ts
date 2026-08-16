import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { CommandAuthorizationService } from '../../modules/auth/command-authorization.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { BotFacadeService } from '../../modules/bot-facade/bot-facade.service';
import { PaperAccountController } from '../../modules/paper-account/paper-account.controller';
import type { PaperAccount } from '../../modules/paper-account/domain/paper-account';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import type { PaperAccountRepository } from '../../modules/paper-account/persistence/paper-account.repository';
import { Role } from '../../modules/identity/role';
import { TradingSessionCommandController } from '../../modules/bot-facade/trading-session-command.controller';
import { TradingSessionQueryController } from '../../modules/bot-facade/trading-session-query.controller';
import { SessionHandoffConsumerService } from '../../modules/product-flow';
import { InMemoryStrategyLibraryReadAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../modules/strategy-library/domain/strategy';
import { createStrategyCertification } from '../../modules/strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../modules/strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../modules/strategy-library/domain/strategy-version';
import { StrategyDeploymentStatus } from '../../modules/strategy-deployment';
import type { StrategyRuntimePort } from '../../modules/strategy-runtime/ports/strategy-runtime.port';
import { TradingOrchestratorController } from '../../modules/trading-orchestrator/trading-orchestrator.controller';
import { TradingOrchestratorProductService } from '../../modules/trading-orchestrator/trading-orchestrator-product.service';
import { TradingOrchestratorModule } from '../../modules/trading-orchestrator/trading-orchestrator.module';
import {
  TRADING_ORCHESTRATOR_QUERY_PORT,
  type TradingOrchestratorQueryPort,
} from '../../modules/trading-orchestrator/ports/trading-orchestrator.port';
import type { TradingSession } from '../../modules/trading-session/domain/trading-session';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import type { TradingSessionRepository } from '../../modules/trading-session/persistence/trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';

const OWNER: AuthUser = {
  userId: 'pc15a-owner',
  email: 'pc15a@example.com',
  displayName: 'PC-15a',
  role: Role.Trader,
};

const at = '2026-08-15T16:00:00.000Z';

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

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter, workspaceId: string) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId,
    createdAt: at,
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
    createdAt: at,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: OWNER.userId,
    certifiedAt: at,
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
    evaluatedAt: at,
  });
  adapter.seedEntry({ strategy, version, certification, eligibility });
}

async function harness() {
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
  const moduleRef = await Test.createTestingModule({
    imports: [TradingOrchestratorModule],
    providers: [TradingOrchestratorProductService],
  }).compile();
  const library = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
  const product = moduleRef.get(TradingOrchestratorProductService);
  const orchestratorQuery = moduleRef.get<TradingOrchestratorQueryPort>(
    TRADING_ORCHESTRATOR_QUERY_PORT,
  );
  const orchestrator = new TradingOrchestratorController(product, commandAuthorization, access);
  const consumer = new SessionHandoffConsumerService(sessionService, sessions, orchestratorQuery);
  const bots = new BotFacadeService(sessionService, sessions);
  const paperController = new PaperAccountController(paperService, commandAuthorization);
  const commands = new TradingSessionCommandController(bots, commandAuthorization, consumer);
  const queries = new TradingSessionQueryController(bots, access, runtime, consumer);
  return {
    moduleRef,
    workspaces,
    library,
    orchestrator,
    paperController,
    commands,
    queries,
    runtime,
    orchestratorQuery,
  };
}

/**
 * PC-15 15-a: Orchestrator emits SessionHandoffIntent; Trading Session consumes it.
 * Command Center reflects the new session. History stays immutable.
 * createsSession remains false. Orchestrator never imports Session.
 */
describe('PC-15 15-a — Orchestrator → Session product flow', () => {
  it('consumes SessionHandoffIntent, creates a paper session, and updates Command Center', async () => {
    const {
      moduleRef,
      workspaces,
      library,
      orchestrator,
      paperController,
      commands,
      queries,
      runtime,
    } = await harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    seedEligible(library, workspace.id);
    const req = { user: OWNER };

    const requested = orchestrator.requestRun(req, workspace.id, { marketSymbol: 'BTCUSDT' });
    const proposed = orchestrator.proposeSelection(
      req,
      workspace.id,
      { runId: requested.orchestrationRunId },
      {
        libraryEntryId: 'lib-entry-1',
        strategyVersionId: '1.0.0',
        envelopeVersion: 'env-1',
        tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      },
    );
    const handed = orchestrator.emitHandoff(
      req,
      workspace.id,
      { runId: requested.orchestrationRunId },
      {
        selectionDecisionId: proposed.selectionDecisionId!,
        deploymentBindRef: 'dep-approved',
      },
    );
    const intentBefore = orchestrator.getHandoff(req, workspace.id, {
      sessionHandoffIntentId: handed.sessionHandoffIntentId!,
    });
    expect(intentBefore.createsSession).toBe(false);
    expect(intentBefore.isOrder).toBe(false);
    expect(intentBefore.status).toBe('proposed');

    const account = await paperController.create(req, workspace.id, undefined, undefined, {
      currency: 'USDT',
      openingCapital: '100000',
      mode: 'paper',
    });
    const created = await commands.create(req, workspace.id, undefined, undefined, {
      paperAccountId: account.id,
      deploymentId: 'dep-approved',
      origin: 'strategy',
      sessionHandoffIntentId: handed.sessionHandoffIntentId,
    });
    expect(created.origin).toBe('strategy');
    expect(created.status).toBe(TradingSessionStatus.CREATED);
    expect(created.mission.deploymentId).toBe('dep-approved');
    expect(created.correlationId).toBe(handed.sessionHandoffIntentId);

    const started = await commands.start(req, created.id, workspace.id);
    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(runtime.arm).toHaveBeenCalled();

    const listed = await queries.list(req, workspace.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    const detail = await queries.get(req, created.id, workspace.id);
    expect(detail.health.lifecycleStatus).toBe(TradingSessionStatus.RUNNING);
    expect(detail.sessionHandoff?.consumed).toBe(true);
    expect(detail.sessionHandoff?.createsSession).toBe(false);
    expect(detail.sessionHandoff?.sessionHandoffIntentId).toBe(handed.sessionHandoffIntentId);

    const intentAfter = orchestrator.getHandoff(req, workspace.id, {
      sessionHandoffIntentId: handed.sessionHandoffIntentId!,
    });
    expect(intentAfter).toEqual(intentBefore);
    expect(intentAfter.createsSession).toBe(false);

    const history = orchestrator.listRuns(req, workspace.id, {});
    expect(history.items[0]?.status).toBe('handed_off');
    expect(history.items[0]?.ownsSessionLifecycle).toBe(false);
    expect(history.items[0]?.sessionHandoffIntentId).toBe(handed.sessionHandoffIntentId);

    const again = await commands.create(req, workspace.id, undefined, undefined, {
      paperAccountId: account.id,
      deploymentId: 'dep-approved',
      origin: 'strategy',
      sessionHandoffIntentId: handed.sessionHandoffIntentId,
      idempotencyKey: 'second-try',
    });
    expect(again.id).toBe(created.id);
    expect(await queries.list(req, workspace.id)).toHaveLength(1);

    await moduleRef.close();
  });

  it('auto-matches an unconsumed handoff on existing Session create and refuses a bind mismatch', async () => {
    const { moduleRef, workspaces, library, orchestrator, paperController, commands, queries } =
      await harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    seedEligible(library, workspace.id);
    const req = { user: OWNER };
    const requested = orchestrator.requestRun(req, workspace.id, { marketSymbol: 'BTCUSDT' });
    const proposed = orchestrator.proposeSelection(
      req,
      workspace.id,
      { runId: requested.orchestrationRunId },
      {
        libraryEntryId: 'lib-entry-1',
        strategyVersionId: '1.0.0',
        envelopeVersion: 'env-1',
        tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      },
    );
    const handed = orchestrator.emitHandoff(
      req,
      workspace.id,
      { runId: requested.orchestrationRunId },
      {
        selectionDecisionId: proposed.selectionDecisionId!,
        deploymentBindRef: 'dep-approved',
      },
    );
    const account = await paperController.create(req, workspace.id, undefined, undefined, {
      currency: 'USDT',
      openingCapital: '100000',
      mode: 'paper',
    });

    await expect(
      commands.create(req, workspace.id, undefined, undefined, {
        paperAccountId: account.id,
        deploymentId: 'other-dep',
        origin: 'strategy',
        sessionHandoffIntentId: handed.sessionHandoffIntentId,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    const created = await commands.create(req, workspace.id, undefined, undefined, {
      paperAccountId: account.id,
      deploymentId: 'dep-approved',
      origin: 'strategy',
    });
    expect(created.correlationId).toBe(handed.sessionHandoffIntentId);
    const detail = await queries.get(req, created.id, workspace.id);
    expect(detail.sessionHandoff?.consumed).toBe(true);
    expect(detail.sessionHandoff?.createsSession).toBe(false);

    await moduleRef.close();
  });
});
