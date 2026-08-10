import { describe, expect, it } from 'vitest';
import { DEFAULT_BINANCE_EXCHANGE_SCOPE_ID } from '../../exchange-scope';
import {
  createTradingSession,
  transitionSession,
} from '../../trading-session/domain/trading-session';
import { TradingSessionStatus } from '../../trading-session/domain/trading-session-status';
import { assertBotIsSessionFacade, BotStatus, toBotView } from './bot-view';

const at = '2026-08-10T14:00:00.000Z';

describe('RC-19 Epic 2 — BotView mapping', () => {
  it('maps every Trading Session to exactly one Bot with identical ids', () => {
    const session = createTradingSession({
      id: 'session-1',
      workspaceId: 'ws-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-1',
      origin: 'manual',
      actorId: 'actor-1',
      idempotencyKey: 'idem-1',
      createdAt: at,
      recordedAt: at,
    });

    const bot = toBotView(session);
    assertBotIsSessionFacade(bot);

    expect(bot.id).toBe(session.id);
    expect(bot.tradingSessionId).toBe(session.id);
    expect(bot.id).toBe(bot.tradingSessionId);
    expect(bot.status).toBe(TradingSessionStatus.CREATED);
    expect(bot.state).toBe(session.status);
    expect(bot.status).toBe(bot.state);
    expect(bot.mission.deploymentId).toBe(session.deploymentId);
    expect(bot.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(Object.isFrozen(bot)).toBe(true);
  });

  it('keeps Bot Status / State synchronized with Session status through transitions', () => {
    const created = createTradingSession({
      id: 'session-2',
      workspaceId: 'ws-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-2',
      origin: 'manual',
      actorId: 'actor-1',
      idempotencyKey: 'idem-2',
      createdAt: at,
      recordedAt: at,
    });
    const running = transitionSession(
      transitionSession(created, TradingSessionStatus.STARTING, at),
      TradingSessionStatus.RUNNING,
      '2026-08-10T14:00:01.000Z',
    );

    const bot = toBotView(running);
    expect(bot.status).toBe(BotStatus.RUNNING);
    expect(bot.state).toBe(TradingSessionStatus.RUNNING);
    expect(bot.version).toBe(running.version);
  });

  it('does not invent separate Bot persistence fields', () => {
    const session = createTradingSession({
      id: 'session-3',
      workspaceId: 'ws-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-3',
      origin: 'strategy',
      actorId: 'actor-1',
      idempotencyKey: 'idem-3',
      createdAt: at,
      recordedAt: at,
    });
    const bot = toBotView(session);
    expect(bot).not.toHaveProperty('botStateMachine');
    expect(bot).not.toHaveProperty('botRuntime');
    expect(bot).not.toHaveProperty('separateLease');
  });
});
