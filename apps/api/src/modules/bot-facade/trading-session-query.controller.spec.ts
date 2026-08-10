import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceAccessService } from '../workspace';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
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
    sessions = new TradingSessionQueryController(bots, workspaceAccess);
    scopes = new ExchangeScopeQueryController(bots, workspaceAccess);
  });

  it('lists bots via Bot Facade without mutations', async () => {
    const listed = await sessions.list({ user: { userId: 'user-1' } } as never, 'ws-1');
    expect(listed).toEqual([bot]);
    expect(bots.listBots).toHaveBeenCalledWith('ws-1');
  });

  it('gets a bot by id and 404s when missing', async () => {
    await expect(
      sessions.get({ user: { userId: 'user-1' } } as never, 'session-1', 'ws-1'),
    ).resolves.toEqual(bot);
    await expect(
      sessions.get({ user: { userId: 'user-1' } } as never, 'missing', 'ws-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
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
