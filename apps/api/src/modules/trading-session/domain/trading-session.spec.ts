import { describe, expect, it } from 'vitest';
import { DEFAULT_BINANCE_EXCHANGE_SCOPE_ID } from '../../exchange-scope';
import { createTacticalEnvelope } from '../../tactical-envelope';
import { canTransition } from './session-transitions';
import { createTradingSession, transitionSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

const ts = '2026-07-18T15:00:00.000Z';

function base() {
  return createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-manual-1',
    origin: 'manual',
    actorId: 'actor-1',
    idempotencyKey: 'create-1',
    createdAt: ts,
    recordedAt: ts,
  });
}

describe('US156 / US217 — Trading Session domain', () => {
  it('creates a manual session in CREATED without strategy fields', () => {
    const session = base();
    expect(session.status).toBe(TradingSessionStatus.CREATED);
    expect(session.origin).toBe('manual');
    expect(session.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(session.tacticalEnvelope).toBeNull();
    expect(session.lease).toBeNull();
    expect(session).not.toHaveProperty('strategyState');
    expect(Object.isFrozen(session)).toBe(true);
  });

  it('assigns the default Binance Exchange Scope automatically', () => {
    const session = base();
    expect(session.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
  });

  it('defaults to no Tactical Envelope (RC-19 Epic 3)', () => {
    const session = base();
    expect(session.tacticalEnvelope).toBeNull();
  });

  it('may optionally reference a Tactical Envelope without changing lifecycle', () => {
    const envelope = createTacticalEnvelope({
      timeframe: '5m',
      allowedStrategyVersion: 'trend-v1',
      riskProfileReference: 'risk-profile:paper-default',
    });
    const session = createTradingSession({
      id: 'session-envelope-1',
      workspaceId: 'ws-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-manual-1',
      tacticalEnvelope: envelope,
      origin: 'manual',
      actorId: 'actor-1',
      idempotencyKey: 'create-envelope-1',
      createdAt: ts,
      recordedAt: ts,
    });

    expect(session.tacticalEnvelope).toEqual(envelope);
    expect(session.status).toBe(TradingSessionStatus.CREATED);

    const running = transitionSession(
      transitionSession(session, TradingSessionStatus.STARTING, ts),
      TradingSessionStatus.RUNNING,
      '2026-07-18T15:00:01.000Z',
    );
    expect(running.tacticalEnvelope).toEqual(envelope);
    expect(running.status).toBe(TradingSessionStatus.RUNNING);
    expect(running.deploymentId).toBe('deployment-manual-1');
  });

  it('creates a strategy-origin session bound only by deploymentId', () => {
    const session = createTradingSession({
      id: 'session-strategy-1',
      workspaceId: 'ws-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-approved-1',
      origin: 'strategy',
      actorId: 'actor-1',
      idempotencyKey: 'create-strategy-1',
      createdAt: ts,
      recordedAt: ts,
    });
    expect(session.origin).toBe('strategy');
    expect(session.deploymentId).toBe('deployment-approved-1');
    expect(session.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(session.tacticalEnvelope).toBeNull();
    expect(session).not.toHaveProperty('parameters');
    expect(session).not.toHaveProperty('configurationHash');
  });

  it('rejects unsupported origins', () => {
    expect(() =>
      createTradingSession({
        id: 'session-bad',
        workspaceId: 'ws-1',
        paperAccountId: 'account-1',
        deploymentId: 'deployment-1',
        origin: 'live' as 'manual',
        actorId: 'actor-1',
        idempotencyKey: 'bad',
        createdAt: ts,
        recordedAt: ts,
      }),
    ).toThrow(/unsupported trading session origin/);
  });

  it('allows only ADR-014 transitions and rejects invalid ones', () => {
    expect(canTransition(TradingSessionStatus.CREATED, TradingSessionStatus.STARTING)).toBe(true);
    expect(canTransition(TradingSessionStatus.RUNNING, TradingSessionStatus.PAUSED)).toBe(true);
    expect(canTransition(TradingSessionStatus.STARTING, TradingSessionStatus.RECOVERING)).toBe(
      true,
    );
    expect(canTransition(TradingSessionStatus.STOPPING, TradingSessionStatus.RECOVERING)).toBe(
      true,
    );
    expect(canTransition(TradingSessionStatus.STOPPED, TradingSessionStatus.RUNNING)).toBe(false);
    expect(() => transitionSession(base(), TradingSessionStatus.RUNNING, ts)).toThrow(
      /invalid trading session transition/,
    );
  });

  it('keeps deployment identity distinct from runtime status', () => {
    const started = transitionSession(
      transitionSession(base(), TradingSessionStatus.STARTING, ts),
      TradingSessionStatus.RUNNING,
      '2026-07-18T15:00:01.000Z',
    );
    expect(started.deploymentId).toBe('deployment-manual-1');
    expect(started.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(started.tacticalEnvelope).toBeNull();
    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(started.version).toBe(3);
  });
});
