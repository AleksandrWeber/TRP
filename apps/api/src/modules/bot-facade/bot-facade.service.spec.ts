import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BINANCE_EXCHANGE_SCOPE_ID } from '../exchange-scope';
import {
  attachLease,
  createTradingSession,
  transitionSession,
  type TradingSession,
} from '../trading-session/domain/trading-session';
import { createSessionLease } from '../trading-session/domain/session-lease';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
import type { TradingSessionRepository } from '../trading-session/persistence/trading-session.repository';
import type { TradingSessionService } from '../trading-session/trading-session.service';
import { BotFacadeService } from './bot-facade.service';

const at = '2026-08-10T14:30:00.000Z';

function sessionFixture(overrides: Partial<TradingSession> = {}): TradingSession {
  const created = createTradingSession({
    id: 'session-bot-1',
    workspaceId: 'workspace-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'manual',
    actorId: 'actor-1',
    idempotencyKey: 'idem-bot-1',
    createdAt: at,
    recordedAt: at,
  });
  return Object.freeze({ ...created, ...overrides }) as TradingSession;
}

function runningSession(): TradingSession {
  const created = sessionFixture();
  const starting = transitionSession(created, TradingSessionStatus.STARTING, at);
  const withLease = attachLease(
    starting,
    createSessionLease({
      ownerId: 'worker-1',
      acquiredAt: at,
      expiresAt: '2026-08-10T14:30:30.000Z',
      previousToken: 0,
    }),
  );
  return transitionSession(withLease, TradingSessionStatus.RUNNING, '2026-08-10T14:30:01.000Z');
}

describe('RC-19 Epic 2 — BotFacadeService', () => {
  const sessionRepository: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    saveIfVersion: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByWorkspaceId: vi.fn(),
    findByStatuses: vi.fn(),
  };

  const sessions = {
    get: vi.fn(),
    create: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
  };

  let facade: BotFacadeService;

  beforeEach(() => {
    vi.clearAllMocks();
    facade = new BotFacadeService(sessions as unknown as TradingSessionService, sessionRepository);
  });

  it('lists Bots as projections of Trading Sessions in the workspace', async () => {
    const a = sessionFixture({ id: 'session-a', idempotencyKey: 'a' });
    const b = sessionFixture({ id: 'session-b', idempotencyKey: 'b' });
    vi.mocked(sessionRepository.findByWorkspaceId).mockResolvedValue([a, b]);

    const bots = await facade.listBots('workspace-1');

    expect(sessionRepository.findByWorkspaceId).toHaveBeenCalledWith('workspace-1');
    expect(bots).toHaveLength(2);
    expect(bots[0]?.id).toBe('session-a');
    expect(bots[0]?.tradingSessionId).toBe('session-a');
    expect(bots[1]?.id).toBe('session-b');
    expect(bots.every((bot) => bot.id === bot.tradingSessionId)).toBe(true);
  });

  it('gets a Bot by id that equals Trading Session id', async () => {
    const session = sessionFixture();
    vi.mocked(sessions.get).mockResolvedValue(session);

    const bot = await facade.getBot('workspace-1', 'session-bot-1');

    expect(sessions.get).toHaveBeenCalledWith('workspace-1', 'session-bot-1');
    expect(bot?.id).toBe(session.id);
    expect(bot?.tradingSessionId).toBe(session.id);
    expect(bot?.mission.deploymentId).toBe('deployment-1');
    expect(bot?.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
  });

  it('returns null when Trading Session is missing', async () => {
    vi.mocked(sessions.get).mockResolvedValue(null);
    await expect(facade.getBot('workspace-1', 'missing')).resolves.toBeNull();
  });

  it('delegates createBot to TradingSessionService.create', async () => {
    const created = sessionFixture({ origin: 'strategy' });
    vi.mocked(sessions.create).mockResolvedValue(created);

    const bot = await facade.createBot({
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-1',
      origin: 'strategy',
      idempotencyKey: 'idem-create-1',
      actorId: 'actor-1',
      createdAt: at,
      recordedAt: at,
    });

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        deploymentId: 'deployment-1',
        origin: 'strategy',
        idempotencyKey: 'idem-create-1',
      }),
    );
    expect(bot.id).toBe(created.id);
    expect(bot.tradingSessionId).toBe(created.id);
    expect(bot.origin).toBe('strategy');
  });

  it('delegates startBot to TradingSessionService.start', async () => {
    const running = runningSession();
    vi.mocked(sessions.start).mockResolvedValue(running);

    const bot = await facade.startBot({
      workspaceId: 'workspace-1',
      botId: running.id,
      actorId: 'actor-1',
      ownerId: 'actor-1',
      recordedAt: at,
      nowIso: at,
    });

    expect(sessions.start).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: running.id, ownerId: 'actor-1' }),
    );
    expect(bot.status).toBe(TradingSessionStatus.RUNNING);
  });

  it('delegates pause to TradingSessionService with sessionId = botId', async () => {
    const paused = sessionFixture({ status: TradingSessionStatus.PAUSED, version: 4 });
    vi.mocked(sessions.pause).mockResolvedValue(paused);

    const bot = await facade.pauseBot({
      workspaceId: 'workspace-1',
      botId: 'session-bot-1',
      actorId: 'actor-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });

    expect(sessions.pause).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      sessionId: 'session-bot-1',
      actorId: 'actor-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
      leaseTtlMs: undefined,
      failureReason: undefined,
      correlationId: undefined,
    });
    expect(bot.status).toBe(TradingSessionStatus.PAUSED);
    expect(bot.id).toBe(bot.tradingSessionId);
  });

  it('delegates resume and stop to TradingSessionService', async () => {
    const running = runningSession();
    const stopped = sessionFixture({ status: TradingSessionStatus.STOPPED, version: 5 });
    vi.mocked(sessions.resume).mockResolvedValue(running);
    vi.mocked(sessions.stop).mockResolvedValue(stopped);

    const resumed = await facade.resumeBot({
      workspaceId: 'workspace-1',
      botId: running.id,
      actorId: 'actor-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });
    expect(sessions.resume).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: running.id }),
    );
    expect(resumed.tradingSessionId).toBe(running.id);

    const halted = await facade.stopBot({
      workspaceId: 'workspace-1',
      botId: running.id,
      actorId: 'actor-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });
    expect(sessions.stop).toHaveBeenCalledWith(expect.objectContaining({ sessionId: running.id }));
    expect(halted.status).toBe(TradingSessionStatus.STOPPED);
  });

  it('maps deleteBot to stop without a separate delete path', async () => {
    const stopped = sessionFixture({ status: TradingSessionStatus.STOPPED, version: 6 });
    vi.mocked(sessions.stop).mockResolvedValue(stopped);

    const bot = await facade.deleteBot({
      workspaceId: 'workspace-1',
      botId: 'session-bot-1',
      actorId: 'actor-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: at,
      nowIso: at,
    });

    expect(sessions.stop).toHaveBeenCalledTimes(1);
    expect(bot.status).toBe(TradingSessionStatus.STOPPED);
    expect(bot.id).toBe('session-bot-1');
  });

  it('proves every Bot representation comes from a Session (1:1)', async () => {
    const session = runningSession();
    vi.mocked(sessions.get).mockResolvedValue(session);
    vi.mocked(sessionRepository.findByWorkspaceId).mockResolvedValue([session]);

    const listed = await facade.listBots('workspace-1');
    const got = await facade.getBot('workspace-1', session.id);

    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(session.id);
    expect(got?.id).toBe(session.id);
    expect(got?.tradingSessionId).toBe(session.id);
    expect(got?.status).toBe(session.status);
    expect(got?.mission.deploymentId).toBe(session.deploymentId);
  });
});
