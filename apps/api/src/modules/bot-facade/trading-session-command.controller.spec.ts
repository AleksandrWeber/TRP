import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
import type { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Role } from '../identity/role';
import type { BotFacadeService } from './bot-facade.service';
import type { BotView } from './domain/bot-view';
import { TradingSessionCommandController } from './trading-session-command.controller';

const running: BotView = Object.freeze({
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
  fencingToken: 7,
});

describe('RC-20 Epic 3 — Trading Session command controller', () => {
  let bots: BotFacadeService;
  let authz: CommandAuthorizationService;
  let controller: TradingSessionCommandController;

  beforeEach(() => {
    bots = {
      getBot: vi.fn(async () => running),
      pauseBot: vi.fn(async () => ({ ...running, status: TradingSessionStatus.PAUSED })),
      resumeBot: vi.fn(async () => running),
      stopBot: vi.fn(async () => ({ ...running, status: TradingSessionStatus.STOPPED })),
    } as unknown as BotFacadeService;
    authz = {
      authorizeTradingCommand: vi.fn(() =>
        Object.freeze({
          actorId: 'user-1',
          workspaceId: 'ws-1',
          role: Role.Trader,
          correlationId: null,
          idempotencyKey: null,
        }),
      ),
    } as unknown as CommandAuthorizationService;
    controller = new TradingSessionCommandController(bots, authz);
  });

  it('pause delegates to BotFacade with SoT lease credentials', async () => {
    const result = await controller.pause(
      { user: { userId: 'user-1', role: Role.Trader } } as never,
      'session-1',
      'ws-1',
    );
    expect(bots.pauseBot).toHaveBeenCalledWith(
      expect.objectContaining({
        botId: 'session-1',
        ownerId: 'runtime-1',
        fencingToken: 7,
        actorId: 'user-1',
      }),
    );
    expect(result.status).toBe(TradingSessionStatus.PAUSED);
  });

  it('resume delegates to BotFacade', async () => {
    await controller.resume(
      { user: { userId: 'user-1', role: Role.Trader } } as never,
      'session-1',
      'ws-1',
    );
    expect(bots.resumeBot).toHaveBeenCalledWith(
      expect.objectContaining({ botId: 'session-1', fencingToken: 7 }),
    );
  });

  it('stop delegates to BotFacade', async () => {
    const result = await controller.stop(
      { user: { userId: 'user-1', role: Role.Trader } } as never,
      'session-1',
      'ws-1',
    );
    expect(bots.stopBot).toHaveBeenCalledWith(
      expect.objectContaining({ botId: 'session-1', ownerId: 'runtime-1' }),
    );
    expect(result.status).toBe(TradingSessionStatus.STOPPED);
  });

  it('surfaces failed lifecycle commands as conflicts', async () => {
    vi.mocked(bots.pauseBot).mockRejectedValue(
      new Error('invalid trading session transition: running → paused'),
    );
    await expect(
      controller.pause(
        { user: { userId: 'user-1', role: Role.Trader } } as never,
        'session-1',
        'ws-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects when lease is unavailable', async () => {
    vi.mocked(bots.getBot).mockResolvedValue({
      ...running,
      leaseOwnerId: null,
      fencingToken: null,
    });
    await expect(
      controller.pause(
        { user: { userId: 'user-1', role: Role.Trader } } as never,
        'session-1',
        'ws-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps missing session to 404', async () => {
    vi.mocked(bots.getBot).mockResolvedValue(null);
    await expect(
      controller.stop(
        { user: { userId: 'user-1', role: Role.Trader } } as never,
        'missing',
        'ws-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps authorization failure to permission denied', async () => {
    vi.mocked(authz.authorizeTradingCommand).mockImplementation(() => {
      throw new Error('trading command requires Trader or Administrator role');
    });
    await expect(
      controller.pause(
        { user: { userId: 'user-1', role: Role.Reader } } as never,
        'session-1',
        'ws-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
