import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceAccessService } from '../workspace';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
import type { StrategyRuntimePort } from '../strategy-runtime/ports/strategy-runtime.port';
import type { BotFacadeService } from './bot-facade.service';
import type { BotView } from './domain/bot-view';
import { ExchangeScopeQueryController } from './exchange-scope-query.controller';
import { TradingSessionQueryController } from './trading-session-query.controller';

const bot: BotView = Object.freeze({
  id: 'session-1',
  tradingSessionId: 'session-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'exchange-scope:binance',
  paperAccountId: 'acct-1',
  status: TradingSessionStatus.RUNNING,
  state: TradingSessionStatus.RUNNING,
  mission: Object.freeze({ deploymentId: 'dep-1' }),
  origin: 'manual',
  version: 1,
  failureReason: null,
  createdAt: '2026-08-10T11:00:00.000Z',
  recordedAt: '2026-08-10T11:00:00.000Z',
  actorId: 'user-1',
  correlationId: null,
  leaseOwnerId: 'runtime-1',
  fencingToken: 1,
});

describe('RC-20 Epic 2 — Trading Session / Exchange Scope query controllers', () => {
  let bots: BotFacadeService;
  let workspaceAccess: WorkspaceAccessService;
  let runtime: StrategyRuntimePort;
  let sessions: TradingSessionQueryController;
  let scopes: ExchangeScopeQueryController;

  beforeEach(() => {
    bots = {
      listBots: vi.fn(async () => [bot]),
      getBot: vi.fn(async (_workspaceId: string, botId: string) => (botId === bot.id ? bot : null)),
    } as unknown as BotFacadeService;
    workspaceAccess = {
      assertMember: vi.fn(),
    } as unknown as WorkspaceAccessService;
    runtime = {
      getLifecycle: vi.fn(async () =>
        Object.freeze({
          workspaceId: 'ws-1',
          sessionId: 'session-1',
          state: 'ARMED',
          fencingToken: 1,
          acceptsTicks: true,
          draining: false,
        }),
      ),
      getDiagnostics: vi.fn(async () =>
        Object.freeze({
          workspaceId: 'ws-1',
          sessionId: 'session-1',
          deploymentId: 'dep-1',
          checkpointVersion: null,
          lastProcessedEventId: null,
          lastProcessedCandleSequence: null,
          runtimeVersion: '1',
          evaluationEnabled: true,
          workerState: 'ARMED',
          acceptsTicks: true,
        }),
      ),
    } as unknown as StrategyRuntimePort;
    sessions = new TradingSessionQueryController(bots, workspaceAccess, runtime);
    scopes = new ExchangeScopeQueryController(bots, workspaceAccess);
  });

  it('lists bots via Bot Facade without mutations', async () => {
    const listed = await sessions.list({ user: { userId: 'user-1' } } as never, 'ws-1');
    expect(listed).toEqual([bot]);
    expect(bots.listBots).toHaveBeenCalledWith('ws-1');
  });

  it('gets a bot by id with health and runtime status and 404s when missing', async () => {
    const view = await sessions.get({ user: { userId: 'user-1' } } as never, 'session-1', 'ws-1');
    expect(view.id).toBe('session-1');
    expect(view.health.lifecycleStatus).toBe(TradingSessionStatus.RUNNING);
    expect(view.runtimeStatus.workerState).toBe('ARMED');
    expect(view.deploymentReference.deploymentId).toBe('dep-1');
    expect(view.sessionHandoff).toBeNull();
    expect(view.latestReport).toBeNull();
    expect(view.delivery).toBeNull();
    await expect(
      sessions.get({ user: { userId: 'user-1' } } as never, 'missing', 'ws-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('attaches report and delivery projections when OperatorProjection is present', async () => {
    const operator = {
      projectSession: vi.fn(async () =>
        Object.freeze({
          latestReport: Object.freeze({
            reportRunId: 'run-1',
            status: 'completed',
            tradingSessionId: 'session-1',
            narrativeAttached: true,
            narrativeUnavailable: false,
          }),
          delivery: Object.freeze({
            deliveryId: 'del-1',
            reportRunId: 'run-1',
            outcome: 'skipped',
            telegramAdapterReached: false,
            skipReasons: Object.freeze(['channel-not-connected'] as const),
          }),
        }),
      ),
    };
    sessions = new TradingSessionQueryController(
      bots,
      workspaceAccess,
      runtime,
      undefined,
      operator as never,
    );
    const view = await sessions.get({ user: { userId: 'user-1' } } as never, 'session-1', 'ws-1');
    expect(view.latestReport?.reportRunId).toBe('run-1');
    expect(view.delivery?.deliveryId).toBe('del-1');
    expect(operator.projectSession).toHaveBeenCalledWith('ws-1', 'session-1');
  });

  it('projects default Exchange Scope with session counts', async () => {
    const overview = await scopes.getDefault({ user: { userId: 'user-1' } } as never, 'ws-1');
    expect(overview).toEqual({
      id: 'exchange-scope:binance',
      exchangeCode: 'binance',
      label: 'Binance',
      sessionCount: 1,
      totalSessionCount: 1,
    });
  });

  it('rejects missing workspace header', async () => {
    await expect(
      sessions.list({ user: { userId: 'user-1' } } as never, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects workspace access failures', async () => {
    vi.mocked(workspaceAccess.assertMember).mockImplementation(() => {
      throw new Error('denied');
    });
    await expect(
      sessions.list({ user: { userId: 'user-1' } } as never, 'ws-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
